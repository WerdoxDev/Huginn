import { prisma } from "@/database";
import { router } from "@/server";
import { useValidatedBody } from "@/utils/route-utils";
import { createTokens } from "@/utils/token-factory";
import {
   validateUsername,
   validateDisplayName,
   validatePassword,
   validateEmail,
   validateUsernameUnique,
   validateEmailUnique,
} from "@/utils/validation";
import { createErrorFactory, createHuginnError } from "@huginn/backend-shared";
import { APIPostRegisterResult, constants, Errors, HttpCode, idFix } from "@huginn/shared";
import { defineEventHandler, setResponseStatus } from "h3";
import { z } from "zod";

const schema = z.object({
   username: z.string(),
   displayName: z.nullable(z.string()),
   email: z.string(),
   password: z.string(),
});

router.post(
   "/auth/register",
   defineEventHandler(async event => {
      const body = await useValidatedBody(event, schema);
      body.username = body.username.toLowerCase();

      const formError = createErrorFactory(Errors.invalidFormBody());

      validateUsername(body.username, formError);
      validateDisplayName(body.displayName, formError);
      validatePassword(body.password, formError);
      validateEmail(body.email, formError);

      if (formError.hasErrors()) {
         return createHuginnError(event, formError);
      }

      const databaseError = createErrorFactory(Errors.invalidFormBody());

      await validateUsernameUnique(body.username, databaseError);
      await validateEmailUnique(body.email, databaseError);

      if (databaseError.hasErrors()) {
         return createHuginnError(event, databaseError);
      }

      const user = idFix(await prisma.user.registerNew(body));

      const [accessToken, refreshToken] = await createTokens(
         { id: user.id },
         constants.ACCESS_TOKEN_EXPIRE_TIME,
         constants.REFRESH_TOKEN_EXPIRE_TIME,
      );

      const json: APIPostRegisterResult = { ...user, token: accessToken, refreshToken: refreshToken };
      setResponseStatus(event, HttpCode.CREATED);
      return json;
   }),
);
