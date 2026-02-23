import { createErrorFactory, createHuginnError, createToken, globalPlugin, verifyJwt } from "@huginn/backend-shared";
import { prisma, type EmailVerification } from "@huginn/backend-shared/database";
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
import { generateVerificationCode, sendVerificationEmail } from "#utils/route-utils";

const schema = t.Object({
   email: t.Optional(t.String()),
   username: t.Optional(t.String()),
   displayName: t.Optional(t.Nullable(t.String())),
   avatar: t.Optional(t.Nullable(t.String())),
   password: t.Optional(t.String()),
   newPassword: t.Optional(t.String()),
});

export const patchMe = new Elysia()
   .use(globalPlugin)
   .use(verifyJwt())
   .patch(
      "/api/users/@me",
      async ({ body, tokenPayload, status, global }) => {
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
            Date.now() - tokenPayload.lastAuthenticatedAt > constants.OAUTH_SENSITIVE_REAUTH_WINDOW;

         if (passwordRequired && !body.password) {
            formError.addError("password", Fields.required());
         }

         if (oauthReauthRequired) {
            return status("Forbidden", createErrorFactory(Errors.requireReauthentication()).toObject());
         }

         if (formError.hasErrors()) {
            return createHuginnError(formError, status);
         }

         const user = await prisma.user.getById(tokenPayload.id, { select: { id: true, password: true } });

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
               username: body.username?.toLowerCase(),
               displayName: !body.displayName && body.displayName !== undefined ? null : body.displayName,
               avatar: avatarHash,
               password: body.newPassword ? body.newPassword : undefined,
            },
            { select: selectPrivateUser },
         );

         let pendingEmailVerification: EmailVerification | undefined;
         email_verification: if (body.email) {
            // because we can't rate limit, we need to check the resend cooldown manually here
            const existingVerification = await prisma.emailVerification.getByUserId(tokenPayload.id);
            if (existingVerification && existingVerification.createdAt.getTime() > Date.now() - constants.EMAIL_VERIFICATION_RESEND_COOLDOWN) {
               break email_verification;
            }

            const expiresAt = Date.now() + constants.EMAIL_VERIFICATION_WINDOW;
            const code = generateVerificationCode();
            pendingEmailVerification = await prisma.emailVerification.createOrUpdate({
               userId: user.id,
               newEmail: body.email,
               expiresAt,
               code,
            });
            global.waitUntil(async () => {
               await sendVerificationEmail(pendingEmailVerification!.newEmail, pendingEmailVerification!.code);
            });
         }

         const lastAuthenticatedAt = Date.now();
         const accessToken = await createToken(
            "user-access",
            { id: tokenPayload.id, authType: tokenPayload.authType, lastAuthenticatedAt },
            constants.ACCESS_TOKEN_EXPIRE_TIME,
         );
         const refreshToken = await createToken(
            "user-refresh",
            { id: tokenPayload.id, authType: tokenPayload.authType, lastAuthenticatedAt },
            constants.REFRESH_TOKEN_EXPIRE_TIME,
         );

         // TODO: When guilds are a thing, this should send an update to users that are viewing that guild
         dispatchToTopic(tokenPayload.id, "user_update", { ...updatedUser, token: accessToken, refreshToken });
         gateway.presenceManager.updateUserPresence(tokenPayload.id, undefined, updatedUser);

         const json: APIPatchCurrentUserResult = {
            ...updatedUser,
            token: accessToken,
            refreshToken,
            pendingEmail: pendingEmailVerification?.newEmail,
         };
         return status("OK", json);
      },
      { body: schema },
   );
