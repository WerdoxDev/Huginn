import { generateVerificationCode, sendVerificationEmail } from "#utils/route-utils";
import {
   validateDisplayName,
   validateEmail,
   validateEmailUnique,
   validatePassword,
   validateUsername,
   validateUsernameUnique,
} from "#utils/validation";
import { createErrorFactory, createHuginnError, createToken, globalPlugin } from "@huginn/backend-shared";
import { prisma } from "@huginn/backend-shared/database";
import { CONSTANTS, type APIPostRegisterResult, Errors } from "@huginn/shared";
import Elysia, { t } from "elysia";

const schema = t.Object({
   username: t.String(),
   displayName: t.Nullable(t.String()),
   email: t.String(),
   password: t.String(),
});

export const postRegister = new Elysia().use(globalPlugin).post(
   "/api/auth/register",
   async ({ status, body, global }) => {
      body.username = body.username.toLowerCase();

      const formError = createErrorFactory(Errors.invalidFormBody());

      validateUsername(body.username, formError);
      validateDisplayName(body.displayName, formError);
      validatePassword(body.password, formError);
      validateEmail(body.email, formError);

      if (formError.hasErrors()) {
         return createHuginnError(formError, status);
      }

      const databaseError = createErrorFactory(Errors.invalidFormBody());

      await validateUsernameUnique(body.username, databaseError);
      await validateEmailUnique(body.email, databaseError);

      if (databaseError.hasErrors()) {
         return createHuginnError(databaseError, status);
      }

      const user = await prisma.user.createOne(body);
      // const lastAuthenticatedAt = Date.now();

      // const accessToken = await createToken(
      //    "user-access",
      //    { id: user.id, authType: "password", lastAuthenticatedAt },
      //    CONSTANTS.ACCESS_TOKEN_EXPIRE_TIME,
      // );
      // const refreshToken = await createToken(
      //    "user-refresh",
      //    { id: user.id, authType: "password", lastAuthenticatedAt },
      //    CONSTANTS.REFRESH_TOKEN_EXPIRE_TIME,
      // );

      const code = generateVerificationCode();
      await prisma.emailVerification.createOrUpdate({
         userId: user.id,
         email: user.email,
         expiresAt: Date.now() + CONSTANTS.EMAIL_VERIFICATION_WINDOW,
         code,
         purpose: "registration",
      });

      global.waitUntil(async () => await sendVerificationEmail(user.email, code));

      const json: APIPostRegisterResult = {
         ...user,
         // token: accessToken,
         // refreshToken: refreshToken,
         pendingEmail: user.email,
      };

      return status("Accepted", json);
   },
   { body: schema },
);
