import { forbidden } from "@huginn/backend-shared";
import Elysia, { t } from "elysia";
import { createHash, randomBytes } from "node:crypto";

import { env } from "#setup";

const querySchema = t.Object({
   flow: t.Union([t.Literal("browser"), t.Literal("desktop")]),
   redirect_url: t.String(),
});

export const getGoogle = new Elysia().get(
   "/api/auth/google",
   async ({ query: { flow, redirect_url }, status, redirect, cookie: { oauth }, request }) => {
      if (!env.GOOGLE_CLIENT_ID || !env.SESSION_PASSWORD) {
         return status("Not Implemented");
      }

      let destination: URL;
      try {
         destination = new URL(redirect_url);
      } catch {
         return forbidden(status);
      }

      const allowedOrigins = env.ALLOWED_ORIGINS.split(",").map((value) => new URL(value.trim()).origin);
      if (!["http:", "https:"].includes(destination.protocol) || !allowedOrigins.includes(destination.origin) || destination.username || destination.password) {
         return forbidden(status);
      }

      const url = new URL(request.url);
      const host = `${url.protocol}//${url.hostname}${url.port ? `:${url.port}` : ""}`;

      const state = randomBytes(32).toString("base64url");
      const codeVerifier = randomBytes(32).toString("base64url");
      const codeChallenge = createHash("sha256").update(codeVerifier).digest("base64url");

      oauth.value = { state, codeVerifier, flow, origin: host, redirect_url };

      const authEndpoint = new URL("https://accounts.google.com/o/oauth2/v2/auth");
      authEndpoint.searchParams.set("client_id", env.GOOGLE_CLIENT_ID);
      authEndpoint.searchParams.set("redirect_uri", `${host}/api/auth/callback/google`);
      authEndpoint.searchParams.set("response_type", "code");
      authEndpoint.searchParams.set("state", state);
      authEndpoint.searchParams.set("code_challenge", codeChallenge);
      authEndpoint.searchParams.set("code_challenge_method", "S256");
      authEndpoint.searchParams.set("scope", "https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile openid");

      return redirect(authEndpoint.toString(), 302);
   },
   { query: querySchema },
);
