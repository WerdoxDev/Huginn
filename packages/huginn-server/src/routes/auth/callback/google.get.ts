import { createToken, forbidden } from "@huginn/backend-shared";
import { prisma } from "@huginn/backend-shared/database";
import { CDNRoutes, CONSTANTS, getFileHash, OAuthCode, snowflake, WorkerID, toSnakeCase } from "@huginnjs/shared";
import Elysia, { t } from "elysia";

import { env } from "#setup";
import { createOAuthHandoff } from "#utils/oauth-handoff";
import { isActiveOAuthLinkSession } from "#utils/oauth-link";
import { cdnUpload, serverFetch } from "#utils/server-request";

const querySchema = t.Object({
   code: t.Optional(t.String()),
   error: t.Optional(t.String()),
   state: t.Optional(t.String()),
   iss: t.Optional(t.String()),
   scope: t.Optional(t.String()),
   authuser: t.Optional(t.String()),
   prompt: t.Optional(t.String()),
});

const cookieSchema = t.Cookie({
   oauth: t.Object({
      state: t.String(),
      codeVerifier: t.String(),
      flow: t.Union([t.Literal("browser"), t.Literal("desktop")]),
      origin: t.String(),
      redirect_url: t.String(),
      link: t.Nullable(t.Optional(t.Object({ userId: t.String(), sessionId: t.String() }))),
   }),
});

type GoogleOAuth2Response =
   | { error: string }
   | {
        access_token: string;
        expires_in: number;
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
   async ({ cookie: { oauth }, status, query: { code, error, state }, redirect, set }) => {
      set.headers["Cache-Control"] = "no-store";
      if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET || !env.SESSION_PASSWORD) {
         return status("Not Implemented");
      }

      const cookieValue = (typeof oauth.value === "string" ? JSON.parse(oauth.value) : oauth.value) as typeof oauth.value;
      if (!cookieValue) return forbidden(status);
      const { flow, state: cookie_state, codeVerifier, redirect_url, origin, link } = cookieValue;

      const redirectWith = (params: Record<string, string>) => {
         const redirectUrl = new URL(redirect_url);
         redirectUrl.search = new URLSearchParams({ flow, ...params }).toString();
         return redirect(redirectUrl.toString(), 302);
      };
      const fail = (reason: OAuthCode) => redirectWith({ error: reason });

      if (cookie_state !== state || !state) {
         // consola.info("Cookie state mismatch", "cookie:", cookie_state, "state:", state);
         return forbidden(status);
      }

      // Code from google oauth
      if (code) {
         const query = new URLSearchParams({
            client_id: env.GOOGLE_CLIENT_ID,
            client_secret: env.GOOGLE_CLIENT_SECRET,
            code: code,
            grant_type: "authorization_code",
            code_verifier: codeVerifier,
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

         if (!googleUser.id || !googleUser.email || !googleUser.verified_email) return forbidden(status);

         const identityProvider = await prisma.identityProvider.findUnique({
            where: { providerType_providerUserId: { providerType: "google", providerUserId: googleUser.id } },
         });

         if (link) {
            // link is expired
            if (!(await isActiveOAuthLinkSession(link.userId, link.sessionId))) return fail(OAuthCode.LINK_EXPIRED);

            // Identity provider exists and is completed, but is connected to a different user
            if (identityProvider?.completed && identityProvider.userId !== BigInt(link.userId)) return fail(OAuthCode.ACCOUNT_ALREADY_CONNECTED);

            const currentProvider = await prisma.identityProvider.findFirst({
               where: { userId: BigInt(link.userId), providerType: "google", completed: true },
            });

            // Provider is already connected to a different user
            if (currentProvider && currentProvider.providerUserId !== googleUser.id) return fail(OAuthCode.PROVIDER_ALREADY_CONNECTED);

            if (!identityProvider) {
               await prisma.identityProvider.create({
                  data: {
                     id: snowflake.generate(WorkerID.IDENTITY_PROVIDER),
                     providerType: "google",
                     providerUserId: googleUser.id,
                     userId: BigInt(link.userId),
                     completed: true,
                  },
               });
            } else if (!identityProvider.completed) {
               const updated = await prisma.identityProvider.updateMany({
                  where: { id: identityProvider.id, completed: false },
                  data: { userId: BigInt(link.userId), completed: true },
               });
               if (!updated.count) return fail(OAuthCode.ACCOUNT_ALREADY_CONNECTED);
            }

            return redirectWith({ connected: "google" });
         }

         // Identity provider exists and is completed
         if (identityProvider?.completed && identityProvider?.userId) {
            const handoffCode = await createOAuthHandoff(identityProvider.userId.toString());
            return redirectWith({ handoff_code: handoffCode });
         }

         // Existing user with the same email
         if (await prisma.user.exists({ email: googleUser.email })) {
            return fail(OAuthCode.ACCOUNT_ALREADY_CONNECTED);
         }

         // Does not exist or is not completed
         const upsertedIdentityProvider = await prisma.identityProvider.upsert({
            where: { providerType_providerUserId: { providerType: "google", providerUserId: googleUser.id } },
            create: {
               id: snowflake.generate(WorkerID.IDENTITY_PROVIDER),
               providerType: "google",
               providerUserId: googleUser.id,
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

         return redirectWith({ oauth_token: token });
      }

      // User clicked "Cancel"
      if (error === "access_denied") {
         return redirectWith({ error: OAuthCode.CANCELLED });
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
