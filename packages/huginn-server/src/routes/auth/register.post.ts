import {
   validateDisplayName,
   validateEmail,
   validateEmailUnique,
   validatePassword,
   validateUsername,
   validateUsernameUnique,
} from "#utils/validation";
import { createHuginnError, createToken } from "@huginn/backend-shared";
import { createErrorFactory } from "@huginn/backend-shared";
import { prisma } from "@huginn/backend-shared/database";
import { constants, type APIPostRegisterResult, Errors } from "@huginn/shared";
import Elysia, { t } from "elysia";

const schema = t.Object({
   username: t.String(),
   displayName: t.Nullable(t.String()),
   email: t.String(),
   password: t.String(),
});

export const postRegister = new Elysia().post(
   "/api/auth/register",
   async ({ status, body }) => {
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

      const json: APIPostRegisterResult = {
         ...user,
         token: accessToken,
         refreshToken: refreshToken,
      };

      return status("Created", json);
   },
   { body: schema },
);
