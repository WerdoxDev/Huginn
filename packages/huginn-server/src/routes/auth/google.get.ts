import { forbidden, tryCatch } from "@huginn/backend-shared";
import { decodeBase64 } from "@std/encoding";
import { envs, gateway } from "#setup";
import Elysia, { t } from "elysia";

const querySchema = t.Object({
   redirect_url: t.Optional(t.String()),
   state: t.String(),
   flow: t.String(),
   session_id: t.Optional(t.String()),
});

export const getGoogle = new Elysia().get(
   "/api/auth/google",
   async ({ query: { flow, state, redirect_url, session_id }, status, redirect, cookie: { oauth }, headers, request }) => {
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

      // If timestamp is not within a 5 minute window
      if (Date.now() - Number(timestamp) > 5 * 60 * 1000) {
         return forbidden(status);
      }

      const allowedOrigins = envs.ALLOWED_ORIGINS?.split(",");
      if (redirect_url && !allowedOrigins?.some((x) => redirect_url.includes(x))) {
         return forbidden(status);
      }

      const url = new URL(request.url);
      const host = `${url.protocol}//${url.hostname}`;

      oauth.value = { state, redirect_url, flow, session_id, used_redirect_url: host };

      if (flow === "websocket" && session_id) {
         gateway.getSessionBySessionId(session_id)?.subscribe(state);
      }

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
