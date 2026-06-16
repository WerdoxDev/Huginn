import { createToken, forbidden } from "@huginn/backend-shared";
import { prisma } from "@huginn/backend-shared/database";
import { CDNRoutes, CONSTANTS, getFileHash, OAuthCode, snowflake, WorkerID } from "@huginn/shared";
import { toSnakeCase } from "@std/text";
import Elysia, { t } from "elysia";

import { envs } from "#setup";
import { cdnUpload, serverFetch } from "#utils/server-request";

const querySchema = t.Object({
   code: t.Optional(t.String()),
   error: t.Optional(t.String()),
   state: t.Optional(t.String()),
});
const cookieSchema = t.Cookie({
   oauth: t.Object({
      state: t.String(),
      flow: t.Union([t.Literal("browser"), t.Literal("desktop")]),
      origin: t.String(),
      redirect_url: t.String(),
   }),
});

type GoogleOAuth2Response =
   | { error: string }
   | {
        access_token: string;
        expires_in: number;
        refresh_token: string;
        scope: string;
        token_type: string;
        id_token: string;
     };

type GoogleUserResponse = {
   id: string;
   email: string;
   verified_email: boolean;
   name: string;
   given_name: string;
   family_name: string;
   picture: string;
};

export const getGoogleCallback = new Elysia().get(
   "/api/auth/callback/google",
   async ({ cookie: { oauth }, status, query: { code, error, state }, redirect }) => {
      if (!envs.GOOGLE_CLIENT_ID || !envs.GOOGLE_CLIENT_SECRET || !envs.SESSION_PASSWORD) {
         return status("Not Implemented");
      }

      const cookieValue = (typeof oauth.value === "string" ? JSON.parse(oauth.value) : oauth.value) as typeof oauth.value;
      const { flow, state: cookie_state, redirect_url, origin } = cookieValue;

      if (cookie_state !== state || !state) {
         // consola.info("Cookie state mismatch", "cookie:", cookie_state, "state:", state);
         return forbidden(status);
      }

      // Code from google oauth
      if (code) {
         const query = new URLSearchParams({
            client_id: envs.GOOGLE_CLIENT_ID,
            client_secret: envs.GOOGLE_CLIENT_SECRET,
            code: code,
            grant_type: "authorization_code",
            redirect_uri: `${origin}/api/auth/callback/google`,
         });

         // Get a token using the code
         const response: GoogleOAuth2Response = await serverFetch("https://accounts.google.com/o/oauth2/token", "POST", {
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: query.toString(),
         });

         // Return 'Forbidden' if can't get the token
         if ("error" in response) {
            // consola.info("Error in response", response);
            return forbidden(status);
         }

         // Use the token to fetch the google user
         const googleUser: GoogleUserResponse = await serverFetch("https://www.googleapis.com/userinfo/v2/me", "GET", {
            token: response.access_token,
         });

         const identityProvider = await prisma.identityProvider.findUnique({
            where: { providerUserId: googleUser.id },
         });

         // Identity provider exists and is completed
         if (identityProvider?.completed && identityProvider?.userId) {
            const accessToken = await createToken(
               "user-access",
               { id: identityProvider.userId.toString(), authType: "google", lastAuthenticatedAt: Date.now() },
               CONSTANTS.ACCESS_TOKEN_EXPIRE_TIME,
            );
            const refreshToken = await createToken(
               "user-refresh",
               { id: identityProvider.userId.toString(), authType: "google", lastAuthenticatedAt: Date.now() },
               CONSTANTS.REFRESH_TOKEN_EXPIRE_TIME,
            );

            const searchParam = new URLSearchParams({
               flow,
               access_token: accessToken,
               refresh_token: refreshToken,
            });
            const redirectUrl = `${redirect_url}?${searchParam.toString()}`;

            return redirect(redirectUrl.toString(), 302);
         }

         // Does not exist or is not completed
         const upsertedIdentityProvider = await prisma.identityProvider.upsert({
            where: { providerUserId: googleUser.id },
            create: {
               id: snowflake.generate(WorkerID.IDENTITY_PROVIDER),
               providerType: "google",
               providerUserId: googleUser.id,
               refreshToken: response.refresh_token,
               completed: false,
            },
            update: {},
         });

         // Get the user's avatar
         let avatarHash: null | string = null;
         if (googleUser.picture) {
            const avatarData = await (await fetch(googleUser.picture.replace("s96-c", "s256-c"))).arrayBuffer();
            avatarHash = getFileHash(avatarData);
            avatarHash = (
               await cdnUpload<string>(CDNRoutes.uploadAvatar(googleUser.id), {
                  files: [{ data: avatarData, name: avatarHash }],
               })
            ).split(".")[0];
         }

         // Create an oauth token
         const token = await createToken(
            "oauth",
            {
               providerId: upsertedIdentityProvider.id.toString(),
               providerUserId: upsertedIdentityProvider.providerUserId,
               email: googleUser.email,
               username: toSnakeCase(googleUser.name),
               fullName: googleUser.name,
               avatarHash: avatarHash,
            },
            CONSTANTS.OAUTH_TOKEN_EXPIRE_TIME,
         );

         const searchParam = new URLSearchParams({ flow, oauth_token: token });
         const redirectUrl = `${redirect_url}?${searchParam.toString()}`;

         return redirect(redirectUrl.toString(), 302);
      }

      // User clicked "Cancel"
      if (error === "access_denied") {
         const redirectUrl = new URL(`${redirect_url}/redirect.html`);
         redirectUrl.searchParams.set("flow", flow);
         redirectUrl.searchParams.set("error", OAuthCode.CANCELLED);

         return redirect(redirectUrl.toString(), 302);
      }
      if (error || !state) {
         // consola.info("Error or no state");
         return forbidden(status);
      }
   },
   {
      query: querySchema,
      cookie: cookieSchema,
      async afterHandle({ cookie: { oauth } }) {
         oauth.remove();
      },
   },
);
