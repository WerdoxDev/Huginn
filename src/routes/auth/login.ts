import { Error, Field, HttpCode } from "@shared/errors";
import { APIPostLoginJSONBody, APIPostLoginResult } from "@shared/api-types";
import { createError } from "../../factory/error-factory";
import { createTokens } from "../../factory/token-factory";
import Elysia, { t } from "elysia";
import { constants } from "@shared/constants";
import { DatabaseAuth, DBErrorType, isDBError } from "../../database";
import { logServerError } from "../../log-utils";
import { InferContext } from "../../..";

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

      ctx.set.status = HttpCode.OK;
      return result;
   } catch (e) {
      if (isDBError(e) && e.error.message === DBErrorType.NULL_USER) {
         ctx.set.status = HttpCode.BAD_REQUEST;
         return createError(Error.invalidFormBody())
            .error("login", Field.invalidLogin())
            .error("password", Field.invalidLogin())
            .toObject();
      }

      logServerError(ctx.path, e);
      ctx.set.status = HttpCode.SERVER_ERROR;
      return undefined;
   }
}

export default route;
