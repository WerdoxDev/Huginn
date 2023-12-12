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
import { InferContext } from "../../..";
import { logAndReturnError, returnError, returnResult, setup } from "../../route-utils";

const route = new Elysia().post("/register", (ctx) => handleRegister(ctx), {
   body: t.Object({
      username: t.String(),
      displayName: t.String(),
      email: t.String(),
      password: t.String(),
   }),
});

async function handleRegister(ctx: InferContext<typeof setup, APIPostRegisterJSONBody>) {
   const formError = createError(Error.invalidFormBody());

   validateUsername(ctx.body.username, formError);
   validateDisplayName(ctx.body.displayName, formError);
   validatePassword(ctx.body.password, formError);
   validateEmail(ctx.body.email, formError);

   if (formError.hasErrors()) {
      return returnError(ctx, formError);
   }

   try {
      const databaseError = createError(Error.invalidFormBody());

      await validateUsernameUnique(ctx.body.username, databaseError);
      await validateEmailUnique(ctx.body.email, databaseError);

      if (databaseError.hasErrors()) {
         return returnError(ctx, databaseError);
      }

      const user = await DatabaseAuth.registerNewUser(ctx.body);

      const [accessToken, refreshToken] = await createTokens(
         { id: user._id },
         constants.ACCESS_TOKEN_EXPIRE_TIME,
         constants.REFRESH_TOKEN_EXPIRE_TIME,
      );
      const result: APIPostRegisterResult = { ...user.toObject(), token: accessToken, refreshToken: refreshToken };

      return returnResult(ctx, result, HttpCode.CREATED);
   } catch (e) {
      return logAndReturnError(ctx, e);
   }
}

export default route;
