import { createRoute, createToken, validator } from "@huginn/backend-shared";
import { createErrorFactory, createHuginnError } from "@huginn/backend-shared";
import { prisma } from "@huginn/backend-shared/database";
import { constants, type APIPostRegisterResult, Errors, HttpCode } from "@huginn/shared";
import { z } from "zod";
import {
   validateDisplayName,
   validateEmail,
   validateEmailUnique,
   validatePassword,
   validateUsername,
   validateUsernameUnique,
} from "#utils/validation";

const schema = z.object({
   username: z.string(),
   displayName: z.nullable(z.string()),
   email: z.string(),
   password: z.string(),
});

createRoute("POST", "/api/auth/register", validator("json", schema), async (c) => {
   const body = c.req.valid("json");
   body.username = body.username.toLowerCase();

   const formError = createErrorFactory(Errors.invalidFormBody());

   validateUsername(body.username, formError);
   validateDisplayName(body.displayName, formError);
   validatePassword(body.password, formError);
   validateEmail(body.email, formError);

   if (formError.hasErrors()) {
      return createHuginnError(c, formError);
   }

   const databaseError = createErrorFactory(Errors.invalidFormBody());

   await validateUsernameUnique(body.username, databaseError);
   await validateEmailUnique(body.email, databaseError);

   if (databaseError.hasErrors()) {
      return createHuginnError(c, databaseError);
   }

   const user = await prisma.user.createOne(body);

   const accessToken = await createToken("user-access", { id: user.id, isOAuth: false }, constants.ACCESS_TOKEN_EXPIRE_TIME);
   const refreshToken = await createToken("user-refresh", { id: user.id }, constants.REFRESH_TOKEN_EXPIRE_TIME);

   const json: APIPostRegisterResult = { ...user, token: accessToken, refreshToken: refreshToken };

   return c.json(json, HttpCode.CREATED);
});
