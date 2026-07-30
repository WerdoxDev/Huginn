import { createToken, globalPlugin, invalidBody, tryCatch } from "@huginn/backend-shared";
import { createErrorFactory } from "@huginn/backend-shared";
import { assertError } from "@huginn/backend-shared/database";
import { prisma } from "@huginn/backend-shared/database";
import { DBErrorType } from "@huginn/backend-shared/types";
import { CONSTANTS, type APIPostLoginResult, Errors, Fields } from "@huginnjs/shared";
import Elysia, { t } from "elysia";

import { generateVerificationCode, sendVerificationEmail } from "#utils/route-utils";

export const postLogin = new Elysia().use(globalPlugin).post(
   "/api/auth/login",
   async ({ body, status, global }) => {
      if (!body.email && !body.username) {
         return invalidBody(status);
      }

      const [error, user] = await tryCatch(async () => await prisma.user.findByCredentials(body));

      if (assertError(error, DBErrorType.NULL_USER)) {
         return status(
            "Bad Request",
            createErrorFactory(Errors.invalidFormBody()).addError("login", Fields.invalidLogin()).addError("password", Fields.invalidLogin()).toObject(),
         );
      }
      if (error) {
         throw error;
      }

      const userVerificationState = await prisma.user.getById(user.id, {
         select: { emailVerifiedAt: true },
      });

      if (!userVerificationState.emailVerifiedAt) {
         const code = generateVerificationCode();
         await prisma.emailVerification.createOrUpdate({
            userId: user.id,
            email: user.email,
            expiresAt: Date.now() + CONSTANTS.EMAIL_VERIFICATION_WINDOW,
            code,
            purpose: "registration",
         });

         global.waitUntil(async () => await sendVerificationEmail(user.email, code));

         const json: APIPostLoginResult = { ...user, pendingEmail: user.email };
         return status("Accepted", json);
      }

      const lastAuthenticatedAt = Date.now();

      const accessToken = await createToken("user-access", { id: user.id, authType: "password", lastAuthenticatedAt }, CONSTANTS.ACCESS_TOKEN_EXPIRE_TIME);
      const refreshToken = await createToken("user-refresh", { id: user.id, authType: "password", lastAuthenticatedAt }, CONSTANTS.REFRESH_TOKEN_EXPIRE_TIME);

      const json: APIPostLoginResult = { ...user, token: accessToken, refreshToken: refreshToken };
      return status(200, json);
   },
   {
      body: t.Object({
         username: t.Optional(t.String()),
         email: t.Optional(t.String()),
         password: t.String(),
      }),
   },
);
