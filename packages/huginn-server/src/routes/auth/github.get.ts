import { forbidden } from "@huginn/backend-shared";
import Elysia from "elysia";

import { env } from "#setup";
import { oauthStartQuerySchema, prepareOAuthAuthorization } from "#utils/oauth-flow";

export const getGitHub = new Elysia().get(
   "/api/auth/github",
   async ({ query: { flow, redirect_url, link_token }, status, redirect, cookie: { oauth }, request }) => {
      if (!env.GITHUB_CLIENT_ID || !env.GITHUB_CLIENT_SECRET || !env.SESSION_PASSWORD) return status("Not Implemented");

      const result = await prepareOAuthAuthorization({
         provider: "github",
         flow,
         redirectUrl: redirect_url,
         linkToken: link_token,
         requestUrl: request.url,
         clientId: env.GITHUB_CLIENT_ID,
         authorizeUrl: "https://github.com/login/oauth/authorize",
         scope: "user:email",
      });

      if (result.kind === "forbidden") return forbidden(status);
      if (result.cookie) oauth.value = result.cookie;

      return redirect(result.url, 302);
   },
   { query: oauthStartQuerySchema },
);
