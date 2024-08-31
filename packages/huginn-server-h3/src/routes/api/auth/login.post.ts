import { assertError, DBErrorType, prisma } from "@/database";
import { router } from "@/server";
import { catchError, useValidatedBody } from "@huginn/backend-shared";
import { createTokens } from "@/utils/token-factory";
import { createErrorFactory, createHuginnError } from "@huginn/backend-shared";
import { APIPostLoginResult, constants, Errors, Fields, HttpCode, idFix } from "@huginn/shared";
import { defineEventHandler, setResponseStatus } from "h3";
import { z } from "zod";

const schema = z.object({
   username: z.optional(z.string()),
   email: z.optional(z.string()),
   password: z.string(),
});

router.post(
   "/auth/login",
   defineEventHandler(async event => {
      const body = await useValidatedBody(event, schema);

      const [error, user] = await catchError(async () => idFix(await prisma.user.findByCredentials(body)));

      if (assertError(error, DBErrorType.NULL_USER)) {
         console.log("WHAT");
         return createHuginnError(
            event,
            createErrorFactory(Errors.invalidFormBody())
               .addError("login", Fields.invalidLogin())
               .addError("password", Fields.invalidLogin()),
         );
      } else if (error) throw error;

      const [accessToken, refreshToken] = await createTokens(
         { id: user.id },
         constants.ACCESS_TOKEN_EXPIRE_TIME,
         constants.REFRESH_TOKEN_EXPIRE_TIME,
      );

      const json: APIPostLoginResult = { ...user, token: accessToken, refreshToken: refreshToken };
      setResponseStatus(event, HttpCode.OK);
      return json;
   }),
);
