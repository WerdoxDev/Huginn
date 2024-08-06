import { DBErrorType, prisma } from "@/db";
import { createTokens } from "@/factory/token-factory";
import { hValidator, handleRequest } from "@/route-utils";
import { createError, errorResponse } from "@huginn/backend-shared";
import { APIPostLoginResult, Error, Field, HttpCode, constants, idFix } from "@huginn/shared";
import { Hono } from "hono";
import { z } from "zod";

const schema = z.object({
   username: z.optional(z.string()),
   email: z.optional(z.string()),
   password: z.string(),
});

const app = new Hono();

app.post("/auth/login", hValidator("json", schema), c =>
   handleRequest(
      c,
      async () => {
         const body = c.req.valid("json");
         const user = idFix(await prisma.user.findByCredentials(body));

         const [accessToken, refreshToken] = await createTokens(
            { id: user.id },
            constants.ACCESS_TOKEN_EXPIRE_TIME,
            constants.REFRESH_TOKEN_EXPIRE_TIME,
         );
         const json: APIPostLoginResult = { ...user, token: accessToken, refreshToken: refreshToken };

         return c.json(json, HttpCode.OK);
      },
      e => {
         if (e.isErrorType(DBErrorType.NULL_USER)) {
            return errorResponse(
               c,
               createError(Error.invalidFormBody()).addError("login", Field.invalidLogin()).addError("password", Field.invalidLogin()),
            );
         }
      },
   ),
);

export default app;
