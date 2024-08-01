import { DBErrorType, prisma } from "@/db";
import { createError } from "@/factory/error-factory";
import { createTokens } from "@/factory/token-factory";
import { error, hValidator, handleRequest } from "@/route-utils";
import { APIPostLoginResult } from "@huginn/shared";
import { constants } from "@huginn/shared";
import { Error, Field, HttpCode } from "@huginn/shared";
import { idFix } from "@huginn/shared";
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
            return error(
               c,
               createError(Error.invalidFormBody()).addError("login", Field.invalidLogin()).addError("password", Field.invalidLogin()),
            );
         }
      },
   ),
);

export default app;
