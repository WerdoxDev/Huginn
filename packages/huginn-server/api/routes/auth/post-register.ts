import { prisma } from "@/db";
import { createError } from "@/factory/error-factory";
import { createTokens } from "@/factory/token-factory";
import { error, hValidator, handleRequest } from "@/route-utils";
import {
   validateDisplayName,
   validateEmail,
   validateEmailUnique,
   validatePassword,
   validateUsername,
   validateUsernameUnique,
} from "@/validation";
import { APIPostRegisterResult } from "@huginn/shared";
import { constants } from "@huginn/shared";
import { Error, HttpCode } from "@huginn/shared";
import { idFix } from "@huginn/shared";
import { Hono } from "hono";
import { z } from "zod";

const schema = z.object({
   username: z.string(),
   displayName: z.string(),
   email: z.string(),
   password: z.string(),
});
const app = new Hono();

app.post("/auth/register", hValidator("json", schema), async c =>
   handleRequest(c, async () => {
      const body = c.req.valid("json");
      body.username = body.username.toLowerCase();

      const formError = createError(Error.invalidFormBody());

      validateUsername(body.username, formError);
      validateDisplayName(body.displayName, formError);
      validatePassword(body.password, formError);
      validateEmail(body.email, formError);

      if (formError.hasErrors()) {
         return error(c, formError);
      }

      const databaseError = createError(Error.invalidFormBody());

      await validateUsernameUnique(body.username, databaseError);
      await validateEmailUnique(body.email, databaseError);

      if (databaseError.hasErrors()) {
         return error(c, databaseError);
      }

      const user = idFix(await prisma.user.registerNew(body));

      const [accessToken, refreshToken] = await createTokens(
         { id: user.id },
         constants.ACCESS_TOKEN_EXPIRE_TIME,
         constants.REFRESH_TOKEN_EXPIRE_TIME,
      );
      const json: APIPostRegisterResult = { ...user, token: accessToken, refreshToken: refreshToken };

      return c.json(json, HttpCode.CREATED);
   }),
);

export default app;
