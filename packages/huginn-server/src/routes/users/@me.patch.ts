import { createErrorFactory, createHuginnError, createToken, globalPlugin, singleError, verifyJwt } from "@huginn/backend-shared";
import { prisma, type EmailVerification } from "@huginn/backend-shared/database";
import { selectPrivateUser } from "@huginn/backend-shared/database/common";
import { type APIPatchCurrentUserResult, CDNRoutes, CONSTANTS, Errors, Fields, getFileHash, toArrayBuffer } from "@huginnjs/shared";
import Elysia, { t } from "elysia";

import { gateway } from "#server";
import { dispatchToTopic } from "#utils/gateway-utils";
import { generateVerificationCode, sendVerificationEmail } from "#utils/route-utils";
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

const schema = t.Object({
   email: t.Optional(t.String()),
   username: t.Optional(t.String()),
   displayName: t.Optional(t.Nullable(t.String())),
   avatar: t.Optional(t.Nullable(t.String())),
   banner: t.Optional(t.Nullable(t.String())),
   bannerColor: t.Optional(t.Nullable(t.String())),
   accentColor: t.Optional(t.Nullable(t.String())),
   bio: t.Optional(t.Nullable(t.String())),
   password: t.Optional(t.String()),
   newPassword: t.Optional(t.String()),
});

export const patchMe = new Elysia()
   .use(globalPlugin)
   .use(verifyJwt())
   .patch("/api/users/@me", { body: schema }, async ({ body, tokenPayload, status, global }) => {
      const formError = createErrorFactory(Errors.invalidFormBody());

      validateUsername(body.username, formError);
      validateDisplayName(body.displayName, formError);
      validateEmail(body.email, formError);
      validatePassword(body.newPassword, formError, "newPassword");

      const sensitiveFieldChanged = body.username || body.newPassword || body.email;
      const passwordRequired = tokenPayload.authType === "password" && sensitiveFieldChanged;
      const oauthReauthRequired =
         (tokenPayload.authType === "github" || tokenPayload.authType === "google") &&
         sensitiveFieldChanged &&
         Date.now() - tokenPayload.lastAuthenticatedAt > CONSTANTS.OAUTH_SENSITIVE_REAUTH_WINDOW;

      if (passwordRequired && !body.password) {
         formError.addError("password", Fields.required());
      }

      if (oauthReauthRequired) {
         return status("Forbidden", createErrorFactory(Errors.requireReauthentication()).toObject());
      }

      if (formError.hasErrors()) {
         return createHuginnError(formError, status);
      }

      const user = await prisma.user.getById(tokenPayload.id, {
         select: { id: true, password: true },
      });

      const databaseError = createErrorFactory(Errors.invalidFormBody());

      if (passwordRequired) await validateCorrectPassword(body.password, user.password, databaseError);
      await validateUsernameUnique(body.username, databaseError);
      await validateEmailUnique(body.email, databaseError);

      if (databaseError.hasErrors()) {
         return createHuginnError(databaseError, status);
      }

      // Undefined means no change, null means delete, other values are set
      let avatarHash: string | undefined | null = undefined;
      if (body.avatar !== null && body.avatar !== undefined) {
         const data = toArrayBuffer(body.avatar);
         if (data.byteLength > CONSTANTS.AVATAR_MAX_FILE_SIZE) {
            return singleError(Errors.fileTooLarge(data.byteLength, CONSTANTS.AVATAR_MAX_FILE_SIZE), status);
         }

         avatarHash = getFileHash(data);
         avatarHash = (
            await cdnUpload<string>(CDNRoutes.uploadAvatar(user.id), {
               files: [{ data: data, name: avatarHash, contentType: "image/png" }],
            })
         ).split(".")[0];
      } else if (body.avatar === null) {
         avatarHash = null;
      }

      let bannerHash: string | undefined | null = undefined;
      if (body.banner !== null && body.banner !== undefined) {
         const data = toArrayBuffer(body.banner);
         if (data.byteLength > CONSTANTS.BANNER_MAX_FILE_SIZE) {
            return singleError(Errors.fileTooLarge(data.byteLength, CONSTANTS.BANNER_MAX_FILE_SIZE), status);
         }

         bannerHash = getFileHash(data);
         bannerHash = (
            await cdnUpload<string>(CDNRoutes.uploadBanner(user.id), {
               files: [{ data: data, name: bannerHash, contentType: "image/png" }],
            })
         ).split(".")[0];
      } else if (body.banner === null) {
         bannerHash = null;
      }

      const updatedUser = await prisma.user.edit(
         tokenPayload.id,
         {
            username: body.username?.toLowerCase(),
            displayName: !body.displayName && body.displayName !== undefined ? null : body.displayName,
            avatar: avatarHash,
            banner: bannerHash,
            bannerColor: body.bannerColor,
            accentColor: body.accentColor,
            bio: body.bio,
            newPassword: body.newPassword ? body.newPassword : undefined,
         },
         { select: selectPrivateUser },
      );

      let pendingEmailVerification: EmailVerification | undefined;
      email_verification: if (body.email) {
         // because we can't rate limit, we need to check the resend cooldown manually here
         const existingVerification = await prisma.emailVerification.getByUserId(tokenPayload.id);
         if (existingVerification && existingVerification.createdAt.getTime() > Date.now() - CONSTANTS.EMAIL_VERIFICATION_RESEND_COOLDOWN) {
            break email_verification;
         }

         const expiresAt = Date.now() + CONSTANTS.EMAIL_VERIFICATION_WINDOW;
         const code = generateVerificationCode();
         pendingEmailVerification = await prisma.emailVerification.createOrUpdate({
            userId: user.id,
            email: body.email,
            expiresAt,
            code,
            purpose: "email_change",
         });
         global.waitUntil(async () => {
            await sendVerificationEmail(pendingEmailVerification!.email, pendingEmailVerification!.code);
         });
      }

      const lastAuthenticatedAt = Date.now();
      const accessToken = await createToken(
         "user-access",
         { id: tokenPayload.id, authType: tokenPayload.authType, lastAuthenticatedAt },
         CONSTANTS.ACCESS_TOKEN_EXPIRE_TIME,
      );
      const refreshToken = await createToken(
         "user-refresh",
         { id: tokenPayload.id, authType: tokenPayload.authType, lastAuthenticatedAt },
         CONSTANTS.REFRESH_TOKEN_EXPIRE_TIME,
      );

      // TODO: When guilds are a thing, this should send an update to users that are viewing that guild
      dispatchToTopic(tokenPayload.id, "user_update", {
         ...updatedUser,
         token: accessToken,
         refreshToken,
      });
      gateway.presenceManager.updateUserPresence(tokenPayload.id, { user: updatedUser });

      const json: APIPatchCurrentUserResult = {
         ...updatedUser,
         token: accessToken,
         refreshToken,
         pendingEmail: pendingEmailVerification?.email,
      };
      return status("OK", json);
   });
