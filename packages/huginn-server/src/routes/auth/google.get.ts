import { forbidden, tryCatch } from "@huginn/backend-shared";
import { decodeBase64 } from "@std/encoding";
import { envs } from "#setup";
import Elysia, { t } from "elysia";

const querySchema = t.Object({
   state: t.String(),
   flow: t.Union([t.Literal("browser"), t.Literal("desktop")]),
   redirect_url: t.String(),
});

export const getGoogle = new Elysia().get(
   "/api/auth/google",
   async ({ query: { flow, state, redirect_url }, status, redirect, cookie: { oauth }, request }) => {
      if (!envs.GOOGLE_CLIENT_ID || !envs.SESSION_PASSWORD) {
         return status("Not Implemented");
      }

      const [error, decodedToken] = await tryCatch(() => new TextDecoder().decode(decodeBase64(state)).split(":"));
      if (error) {
         return forbidden(status);
      }

      const [timestamp, randomValue] = decodedToken;
      if (!timestamp || !randomValue || randomValue.length !== 16) {
         return forbidden(status);
      }

      // If timestamp is not within a 5 minute window.
      if (Date.now() - Number(timestamp) > 5 * 60 * 1000) {
         return forbidden(status);
      }

      // const allowedOrigins = envs.ALLOWED_ORIGINS?.split(",");
      // if (redirect_url && !allowedOrigins?.some((x) => redirect_url.includes(x))) {
      //    return forbidden(status);
      // }

      // User clicks on google
      // Gets sent to /api/auth/google with a generated state and flow
      // Gets redirected to google oauth by telling google its state and to redirect to api/auth/callback/google
      // It's oauth state is checked and gets redirected to ?

      const url = new URL(request.url);
      const host = `${url.protocol}//${url.hostname}${url.port ? `:${url.port}` : ""}`;

      oauth.value = { state, flow, origin: host, redirect_url };

      const authEndpoint = new URL("https://accounts.google.com/o/oauth2/v2/auth");
      authEndpoint.searchParams.set("client_id", envs.GOOGLE_CLIENT_ID);
      authEndpoint.searchParams.set("redirect_uri", `${host}/api/auth/callback/google`);
      authEndpoint.searchParams.set("access_type", "offline");
      authEndpoint.searchParams.set("response_type", "code");
      authEndpoint.searchParams.set("prompt", "consent");
      authEndpoint.searchParams.set("state", state);
      authEndpoint.searchParams.set(
         "scope",
         "https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile openid",
      );
      authEndpoint.searchParams.set("access_type", "offline");

      return redirect(authEndpoint.toString(), 302);
   },
   { query: querySchema },
);
