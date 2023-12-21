import { prisma } from "@/src/database";
import { createError } from "@/src/factory/error-factory";
import { createTokens } from "@/src/factory/token-factory";
import { error, getJwt, hValidator, handleRequest, verifyJwt } from "@/src/route-utils";
import {
   validateCorrectPassword,
   validateDisplayName,
   validateEmail,
   validateEmailUnique,
   validateUsername,
   validateUsernameUnique,
} from "@/src/validation";
import { APIPatchCurrentUserJSONBody, APIPatchCurrentUserResult } from "@shared/api-types";
import { constants } from "@shared/constants";
import { Error, Field, HttpCode } from "@shared/errors";
import { Hono } from "hono";
import { z } from "zod";

const schema = z.object({
   email: z.optional(z.string()),
   username: z.optional(z.string()),
   displayName: z.optional(z.string()),
   avatar: z.optional(z.string()),
   password: z.optional(z.string()),
   newPassword: z.optional(z.string()),
});

const app = new Hono();

app.patch("/users/@me", verifyJwt(), hValidator("json", schema), c =>
   handleRequest(c, async () => {
      const body = (await c.req.json()) as APIPatchCurrentUserJSONBody;
      const payload = getJwt(c);

      const formError = createError(Error.invalidFormBody());

      validateUsername(body.username, formError);
      validateDisplayName(body.displayName, formError);
      validateEmail(body.email, formError);

      if ((body.username || body.newPassword) && !body.password) {
         formError.error("password", Field.required());
      }

      if (formError.hasErrors()) {
         return error(c, formError);
      }

      const databaseError = createError(Error.invalidFormBody());

      const user = await prisma.user.getById(payload!.id);
      validateCorrectPassword(body.password, user.password || "", databaseError);

      await validateUsernameUnique(body.username, databaseError);
      await validateEmailUnique(body.email, databaseError);

      if (databaseError.hasErrors()) {
         return error(c, databaseError);
      }

      const updatedUser = await prisma.user.edit(payload.id, {
         email: body.email,
         username: body.username,
         displayName: body.displayName,
         avatar: body.avatar,
         password: body.newPassword,
      });

      const [accessToken, refreshToken] = await createTokens(
         { id: payload!.id },
         constants.ACCESS_TOKEN_EXPIRE_TIME,
         constants.REFRESH_TOKEN_EXPIRE_TIME,
      );

      const json: APIPatchCurrentUserResult = { ...updatedUser, token: accessToken, refreshToken };

      return c.json(json, HttpCode.OK);
   }),
);

export default app;
