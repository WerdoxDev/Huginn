import { createErrorFactory, createHuginnError, unauthorized, verifyJwt } from "@huginn/backend-shared";
import { prisma } from "@huginn/backend-shared/database";
import { type APIPostOAuthConfirmResult, CDNRoutes, Errors, WorkerID, getFileHash, snowflake, toArrayBuffer, type OAuthProvider } from "@huginnjs/shared";
import Elysia, { t } from "elysia";

import { createAuthSession } from "#utils/auth-session";
import { cdnUpload } from "#utils/server-request";
// import { createTokens } from "#utils/token-factory";
import { validateDisplayName, validateUsername, validateUsernameUnique } from "#utils/validation";

const schema = t.Object({
   username: t.String(),
   displayName: t.Nullable(t.String()),
   avatar: t.Nullable(t.String()),
});

export const postOauthConfirm = new Elysia().use(verifyJwt("oauth")).post(
   "/api/auth/oauth-confirm",
   async ({ body, status, tokenPayload, request }) => {
      const identityProvider = await prisma.identityProvider.findUnique({
         where: { id: BigInt(tokenPayload.providerId) },
      });

      if (!identityProvider) {
         return unauthorized(status);
      }
      if (identityProvider.providerUserId !== tokenPayload.providerUserId || identityProvider.completed) return unauthorized(status);

      const formError = createErrorFactory(Errors.invalidFormBody());

      validateUsername(body.username, formError);
      validateDisplayName(body.displayName, formError);

      if (formError.hasErrors()) {
         return createHuginnError(formError, status);
      }

      const databaseError = createErrorFactory(Errors.invalidFormBody());

      if (!(await validateUsernameUnique(body.username, databaseError))) {
         return createHuginnError(databaseError, status);
      }

      const newUserId = snowflake.generateString(WorkerID.AUTH);

      // null means no avatar, other values are set
      let avatarHash: string | null = null;
      if (body.avatar !== null) {
         const data = toArrayBuffer(body.avatar);
         avatarHash = getFileHash(data);

         avatarHash = (
            await cdnUpload<string>(CDNRoutes.uploadAvatar(newUserId), {
               files: [{ data: data, name: avatarHash }],
            })
         ).split(".")[0];
      } else if (body.avatar === null) {
         avatarHash = null;
      }

      const user = await prisma.user.createOne({
         email: tokenPayload.email,
         emailVerifiedAt: new Date(),
         username: body.username,
         displayName: body.displayName,
         avatar: avatarHash,
         id: BigInt(newUserId),
      });

      const result = await prisma.identityProvider.update({
         where: { id: BigInt(tokenPayload.providerId) },
         data: { userId: BigInt(user.id), completed: true },
         select: { providerType: true },
      });

      const tokens = await createAuthSession(user.id, "oauth", result.providerType as OAuthProvider, request.headers.get("user-agent") ?? undefined);

      const json: APIPostOAuthConfirmResult = {
         ...user,
         ...tokens,
      };
      return status("Created", json);
   },
   { body: schema },
);
