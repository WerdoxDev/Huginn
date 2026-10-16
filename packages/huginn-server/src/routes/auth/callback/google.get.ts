import { forbidden } from "@huginn/backend-shared";
import { OAuthCode } from "@huginnjs/shared";
import Elysia from "elysia";

import { env } from "#setup";
import { completeOAuth, oauthCallbackQuerySchema, oauthCookieSchema, oauthRedirectUrl } from "#utils/oauth-flow";
import { serverFetch } from "#utils/server-request";

type GoogleOAuth2Response = { error: string } | { access_token: string };
type GoogleUserResponse = {
   id: string;
   email: string;
   verified_email: boolean;
   name: string;
   picture: string;
};

export const getGoogleCallback = new Elysia().get(
   "/api/auth/callback/google",
   async ({ cookie: { oauth }, status, query: { code, error, state }, redirect }) => {
      if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET || !env.SESSION_PASSWORD) return status("Not Implemented");

      const cookieValue = (typeof oauth.value === "string" ? JSON.parse(oauth.value) : oauth.value) as typeof oauth.value;
      if (!cookieValue || cookieValue.provider !== "google" || !state || cookieValue.state !== state) return forbidden(status);
      const { flow, codeVerifier, redirect_url, origin, link } = cookieValue;

      const redirectWith = (params: Record<string, string>) => redirect(oauthRedirectUrl(redirect_url, flow, params), 302);

      if (code) {
         const query = new URLSearchParams({
            client_id: env.GOOGLE_CLIENT_ID,
            client_secret: env.GOOGLE_CLIENT_SECRET,
            code,
            grant_type: "authorization_code",
            code_verifier: codeVerifier,
            redirect_uri: `${origin}/api/auth/callback/google`,
         });

         const response: GoogleOAuth2Response = await serverFetch("https://accounts.google.com/o/oauth2/token", "POST", {
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: query.toString(),
         });

         if ("error" in response || !response.access_token) return forbidden(status);
         const googleUser: GoogleUserResponse = await serverFetch("https://www.googleapis.com/userinfo/v2/me", "GET", { token: response.access_token });
         if (!googleUser.id || !googleUser.email || !googleUser.verified_email) return forbidden(status);

         return redirectWith(
            await completeOAuth(
               "google",
               {
                  id: googleUser.id,
                  email: googleUser.email,
                  name: googleUser.name,
                  picture: googleUser.picture?.replace("s96-c", "s256-c"),
                  accountIdentifier: googleUser.email,
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
