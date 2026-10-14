import { forbidden } from "@huginn/backend-shared";
import { OAuthCode } from "@huginnjs/shared";
import Elysia from "elysia";

import { env } from "#setup";
import { completeOAuth, oauthCallbackQuerySchema, oauthCookieSchema, oauthRedirectUrl } from "#utils/oauth-flow";
import { serverFetch } from "#utils/server-request";

type GitHubTokenResponse = { access_token?: string; error?: string };
type GitHubUserResponse = { id: number; login: string; name: string | null; avatar_url: string | null };
type GitHubEmailResponse = { email: string; primary: boolean; verified: boolean };

export const getGitHubCallback = new Elysia().get(
   "/api/auth/callback/github",
   async ({ cookie: { oauth }, status, query: { code, error, state }, redirect }) => {
      if (!env.GITHUB_CLIENT_ID || !env.GITHUB_CLIENT_SECRET || !env.SESSION_PASSWORD) return status("Not Implemented");

      const cookieValue = (typeof oauth.value === "string" ? JSON.parse(oauth.value) : oauth.value) as typeof oauth.value;
      if (!cookieValue || cookieValue.provider !== "github" || !state || cookieValue.state !== state) return forbidden(status);
      const { flow, codeVerifier, redirect_url, origin, link } = cookieValue;

      const redirectWith = (params: Record<string, string>) => redirect(oauthRedirectUrl(redirect_url, flow, params), 302);

      if (code) {
         const query = new URLSearchParams({
            client_id: env.GITHUB_CLIENT_ID,
            client_secret: env.GITHUB_CLIENT_SECRET,
            code,
            code_verifier: codeVerifier,
            redirect_uri: `${origin}/api/auth/callback/github`,
         });

         const token: GitHubTokenResponse = await serverFetch("https://github.com/login/oauth/access_token", "POST", {
            headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
            body: query.toString(),
         });

         if (token.error || !token.access_token) return forbidden(status);
         const githubUser: GitHubUserResponse = await serverFetch("https://api.github.com/user", "GET", {
            token: token.access_token,
            headers: { Accept: "application/vnd.github+json" },
         });

         const emails: GitHubEmailResponse[] = await serverFetch("https://api.github.com/user/emails", "GET", {
            token: token.access_token,
            headers: { Accept: "application/vnd.github+json" },
         });

         const email = Array.isArray(emails) ? emails.find((item) => item.primary && item.verified)?.email : undefined;
         if (!githubUser.id || !githubUser.login || !email) return forbidden(status);

         return redirectWith(
            await completeOAuth(
               "github",
               {
                  id: String(githubUser.id),
                  email,
                  name: githubUser.name || githubUser.login,
                  picture: githubUser.avatar_url,
                  accountIdentifier: githubUser.login,
               },
               link,
            ),
         );
      }

      if (error === "access_denied") return redirectWith({ error: OAuthCode.CANCELLED });

      return forbidden(status);
   },
   {
      query: oauthCallbackQuerySchema,
      cookie: oauthCookieSchema,
      async afterHandle({ cookie: { oauth } }) {
         oauth.remove();
      },
   },
);
