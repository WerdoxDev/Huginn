import { APIPostRegisterResult, APIPostRegisterJSONBody } from "@shared/api-types";
import { HttpCode, Error } from "@shared/errors";
import Elysia, { t } from "elysia";
import { constants } from "@shared/constants";
import { createError } from "../../factory/error-factory";
import { createTokens } from "../../factory/token-factory";
import { DatabaseAuth } from "../../database";
import {
   validateDisplayName,
   validateEmail,
   validateEmailUnique,
   validatePassword,
   validateUsername,
   validateUsernameUnique,
} from "../../validation";
import { logServerError } from "../../log-utils";
import { InferContext } from "../../..";

const route = new Elysia();

route.post("/register", (ctx) => handleRegister(ctx), {
   body: t.Object({
      username: t.String(),
      displayName: t.String(),
      email: t.String(),
      password: t.String(),
   }),
});

async function handleRegister(ctx: InferContext<typeof route, APIPostRegisterJSONBody>) {
   const formError = createError(Error.invalidFormBody());

   validateUsername(ctx.body.username, formError);
   validateDisplayName(ctx.body.displayName, formError);
   validatePassword(ctx.body.password, formError);
   validateEmail(ctx.body.email, formError);

   if (formError.hasErrors()) {
      ctx.set.status = HttpCode.BAD_REQUEST;
      return formError.toObject();
   }

   try {
      const databaseError = createError(Error.invalidFormBody());

      await validateUsernameUnique(ctx.body.username, databaseError);
      await validateEmailUnique(ctx.body.email, databaseError);

      if (databaseError.hasErrors()) {
         ctx.set.status = HttpCode.BAD_REQUEST;
         return databaseError.toObject();
      }

      const user = await DatabaseAuth.registerNewUser(ctx.body);

      const [accessToken, refreshToken] = await createTokens(
         { id: user._id },
         constants.ACCESS_TOKEN_EXPIRE_TIME,
         constants.REFRESH_TOKEN_EXPIRE_TIME,
      );
      const result: APIPostRegisterResult = { ...user.toObject(), token: accessToken, refreshToken: refreshToken };

      ctx.set.status = HttpCode.CREATED;
      return result;
   } catch (e) {
      logServerError(ctx.path, e);

      ctx.set.status = HttpCode.SERVER_ERROR;
      return undefined;
   }
}

export default route;
