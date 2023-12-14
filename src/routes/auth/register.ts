import { APIPostRegisterResult, APIPostRegisterJSONBody } from "@shared/api-types";
import { HttpCode, Error } from "@shared/errors";
import Elysia, { t } from "elysia";
import { constants } from "@shared/constants";
import { InferContext } from "@/index";
import { DatabaseAuth } from "@/src/database";
import { createError } from "@/src/factory/error-factory";
import { createTokens } from "@/src/factory/token-factory";
import { setup, error, result, serverError } from "@/src/route-utils";
import {
   validateUsername,
   validateDisplayName,
   validatePassword,
   validateEmail,
   validateUsernameUnique,
   validateEmailUnique,
} from "@/src/validation";

const route = new Elysia().post("/auth/register", (ctx) => handleRegister(ctx), {
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
      return error(ctx, formError);
   }

   try {
      const databaseError = createError(Error.invalidFormBody());

      await validateUsernameUnique(ctx.body.username, databaseError);
      await validateEmailUnique(ctx.body.email, databaseError);

      if (databaseError.hasErrors()) {
         return error(ctx, databaseError);
      }

      const user = await DatabaseAuth.registerNewUser(ctx.body);

      const [accessToken, refreshToken] = await createTokens(
         { id: user._id },
         constants.ACCESS_TOKEN_EXPIRE_TIME,
         constants.REFRESH_TOKEN_EXPIRE_TIME,
      );
      const json: APIPostRegisterResult = { ...user.toObject(), token: accessToken, refreshToken: refreshToken };

      return result(ctx, json, HttpCode.CREATED);
   } catch (e) {
      return serverError(ctx, e);
   }
}

export default route;
