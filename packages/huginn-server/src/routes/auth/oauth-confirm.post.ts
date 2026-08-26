import { createErrorFactory, createHuginnError, createToken, unauthorized, verifyJwt } from "@huginn/backend-shared";
import { prisma } from "@huginn/backend-shared/database";
import {
   CONSTANTS,
   type APIPostOAuthConfirmResult,
   CDNRoutes,
   Errors,
   WorkerID,
   getFileHash,
   snowflake,
   toArrayBuffer,
   type OAuthType,
} from "@huginnjs/shared";
import Elysia, { t } from "elysia";

import { cdnUpload } from "#utils/server-request";
// import { createTokens } from "#utils/token-factory";
import { validateDisplayName, validateUsername, validateUsernameUnique } from "#utils/validation";

const schema = t.Object({
   username: t.String(),
   displayName: t.Nullable(t.String()),
   avatar: t.Nullable(t.String()),
});

export const postOauthConfirm = new Elysia()
   .use(verifyJwt("oauth"))
   .post("/api/auth/oauth-confirm", { body: schema }, async ({ body, status, tokenPayload }) => {
      const identityProvider = await prisma.identityProvider.findUnique({
         where: { id: BigInt(tokenPayload.providerId) },
      });

      if (!identityProvider) {
         return unauthorized(status);
      }

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
         username: body.username,
         displayName: body.displayName,
         avatar: avatarHash,
         id: BigInt(newUserId),
      });

      const result = await prisma.identityProvider.update({
         where: { providerUserId: tokenPayload.providerUserId },
         data: { userId: BigInt(user.id), completed: true },
         select: { providerType: true },
      });

      const lastAuthenticatedAt = Date.now();
      const accessToken = await createToken(
         "user-access",
         { id: user.id, authType: result.providerType as OAuthType, lastAuthenticatedAt },
         CONSTANTS.ACCESS_TOKEN_EXPIRE_TIME,
      );
      const refreshToken = await createToken("user-refresh", { id: user.id, authType: "password", lastAuthenticatedAt }, CONSTANTS.REFRESH_TOKEN_EXPIRE_TIME);

      const json: APIPostOAuthConfirmResult = {
         ...user,
         token: accessToken,
         refreshToken: refreshToken,
      };
      return status("Created", json);
   });
