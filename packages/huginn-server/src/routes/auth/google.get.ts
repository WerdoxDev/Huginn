import { forbidden } from "@huginn/backend-shared";
import Elysia from "elysia";

import { env } from "#setup";
import { oauthStartQuerySchema, prepareOAuthAuthorization } from "#utils/oauth-flow";

export const getGoogle = new Elysia().get(
   "/api/auth/google",
   async ({ query: { flow, redirect_url, link_token }, status, redirect, cookie: { oauth }, request }) => {
      if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET || !env.SESSION_PASSWORD) return status("Not Implemented");

      const result = await prepareOAuthAuthorization({
         provider: "google",
         flow,
         redirectUrl: redirect_url,
         linkToken: link_token,
         requestUrl: request.url,
         clientId: env.GOOGLE_CLIENT_ID,
         authorizeUrl: "https://accounts.google.com/o/oauth2/v2/auth",
         scope: "https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile openid",
      });

      if (result.kind === "forbidden") return forbidden(status);
      if (result.cookie) oauth.value = result.cookie;

      return redirect(result.url, 302);
   },
   { query: oauthStartQuerySchema },
);
