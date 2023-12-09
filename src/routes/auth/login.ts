import { Error, Field } from "@shared/errors";
import { APIPostLoginJSONBody, APIPostLoginResult } from "@shared/api-types";
import { createError } from "../../factory/error-factory";
import { createTokens } from "../../factory/token-factory";
import Elysia, { t } from "elysia";
import { constants } from "@shared/constants";
import { DatabaseAuth, DBErrorType, isDBError } from "../../database";
import { InferContext } from "../../..";
import { logAndReturnError, returnError, returnResult } from "../../route-utils";

const route = new Elysia();

route.post("/login", (ctx) => handleLogin(ctx), {
   body: t.Object({
      username: t.Optional(t.String()),
      email: t.Optional(t.String()),
      password: t.String(),
   }),
});

async function handleLogin(ctx: InferContext<typeof route, APIPostLoginJSONBody>) {
   try {
      const user = await DatabaseAuth.userByCredentials(ctx.body);

      const [accessToken, refreshToken] = await createTokens(
         { id: user._id },
         constants.ACCESS_TOKEN_EXPIRE_TIME,
         constants.REFRESH_TOKEN_EXPIRE_TIME,
      );
      const result: APIPostLoginResult = { ...user.toObject(), token: accessToken, refreshToken: refreshToken };

      return returnResult(ctx, result);
   } catch (e) {
      if (isDBError(e) && e.error.message === DBErrorType.NULL_USER) {
         return returnError(
            ctx,
            createError(Error.invalidFormBody()).error("login", Field.invalidLogin()).error("password", Field.invalidLogin()),
         );
      }

      return logAndReturnError(ctx, e);
   }
}

export default route;
