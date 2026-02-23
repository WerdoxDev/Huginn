import { createToken, invalidBody, tryCatch } from "@huginn/backend-shared";
import { createErrorFactory } from "@huginn/backend-shared";
import { assertError } from "@huginn/backend-shared/database";
import { prisma } from "@huginn/backend-shared/database";
import { DBErrorType } from "@huginn/backend-shared/types";
import { constants, type APIPostLoginResult, Errors, Fields } from "@huginn/shared";
import Elysia, { t } from "elysia";

export const postLogin = new Elysia().post(
   "/api/auth/login",
   async ({ body, status }) => {
      if (!body.email && !body.username) {
         return invalidBody(status);
      }

      const [error, user] = await tryCatch(async () => await prisma.user.findByCredentials(body));

      if (assertError(error, DBErrorType.NULL_USER)) {
         return status(
            "Bad Request",
            createErrorFactory(Errors.invalidFormBody())
               .addError("login", Fields.invalidLogin())
               .addError("password", Fields.invalidLogin())
               .toObject(),
         );
      }
      if (error) {
         throw error;
      }

      const lastAuthenticatedAt = Date.now();

      const accessToken = await createToken(
         "user-access",
         { id: user.id, authType: "password", lastAuthenticatedAt },
         constants.ACCESS_TOKEN_EXPIRE_TIME,
      );
      const refreshToken = await createToken(
         "user-refresh",
         { id: user.id, authType: "password", lastAuthenticatedAt },
         constants.REFRESH_TOKEN_EXPIRE_TIME,
      );

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
