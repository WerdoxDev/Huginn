import { createErrorFactory, createHuginnError, createToken, verifyJwt } from "@huginn/backend-shared";
import { prisma } from "@huginn/backend-shared/database";
import { selectPrivateUser } from "@huginn/backend-shared/database/common";
import { type APIPatchCurrentUserResult, CDNRoutes, constants, Errors, Fields, getFileHash, toArrayBuffer } from "@huginn/shared";
import { gateway } from "#setup";
import { dispatchToTopic } from "#utils/gateway-utils";
import { cdnUpload } from "#utils/server-request";
import {
   validateCorrectPassword,
   validateDisplayName,
   validateEmail,
   validateEmailUnique,
   validatePassword,
   validateUsername,
   validateUsernameUnique,
} from "#utils/validation";
import Elysia, { t } from "elysia";

const schema = t.Object({
   email: t.Optional(t.String()),
   username: t.Optional(t.String()),
   displayName: t.Optional(t.Nullable(t.String())),
   avatar: t.Optional(t.Nullable(t.String())),
   password: t.Optional(t.String()),
   newPassword: t.Optional(t.String()),
});

export const patchMe = new Elysia().use(verifyJwt()).patch(
   "/api/users/@me",
   async ({ body, tokenPayload, status }) => {
      const formError = createErrorFactory(Errors.invalidFormBody());

      validateUsername(body.username, formError);
      validateDisplayName(body.displayName, formError);
      validateEmail(body.email, formError);
      validatePassword(body.newPassword, formError, "newPassword");

      if (body.newPassword && !body.password) {
         formError.addError("password", Fields.required());
      }

      if (formError.hasErrors()) {
         return createHuginnError(formError, status);
      }

      const databaseError = createErrorFactory(Errors.invalidFormBody());

      const user = await prisma.user.getById(tokenPayload.id, { select: { id: true, password: true } });
      await validateCorrectPassword(body.password, user.password, databaseError);

      await validateUsernameUnique(body.username, databaseError);
      await validateEmailUnique(body.email, databaseError);

      if (databaseError.hasErrors()) {
         return createHuginnError(databaseError, status);
      }

      // Undefined means no change, null means delete, other values are set
      let avatarHash: string | undefined | null = undefined;
      if (body.avatar !== null && body.avatar !== undefined) {
         const data = toArrayBuffer(body.avatar);
         avatarHash = getFileHash(data);

         avatarHash = (
            await cdnUpload<string>(CDNRoutes.uploadAvatar(user.id), {
               files: [{ data: data, name: avatarHash }],
            })
         ).split(".")[0];
      } else if (body.avatar === null) {
         avatarHash = null;
      }

      const updatedUser = await prisma.user.edit(
         tokenPayload.id,
         {
            email: body.email,
            username: body.username?.toLowerCase(),
            displayName: !body.displayName && body.displayName !== undefined ? null : body.displayName,
            avatar: avatarHash,
            password: body.newPassword ? body.newPassword : undefined,
         },
         { select: selectPrivateUser },
      );

      const accessToken = await createToken(
         "user-access",
         { id: tokenPayload.id, isOAuth: tokenPayload.isOAuth },
         constants.ACCESS_TOKEN_EXPIRE_TIME,
      );
      const refreshToken = await createToken("user-refresh", { id: tokenPayload.id }, constants.REFRESH_TOKEN_EXPIRE_TIME);

      // TODO: When guilds are a thing, this should send an update to users that are viewing that guild
      dispatchToTopic(tokenPayload.id, "user_update", { ...updatedUser, token: accessToken, refreshToken });

      gateway.presenceManager.updateUserPresence(tokenPayload.id, updatedUser);

      const json: APIPatchCurrentUserResult = { ...updatedUser, token: accessToken, refreshToken };
      return status("OK", json);
   },
   { body: schema },
);
