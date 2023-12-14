import { Error, Field } from "@shared/errors";
import { APIPostLoginJSONBody, APIPostLoginResult } from "@shared/api-types";
import { t } from "elysia";
import { constants } from "@shared/constants";
import { DatabaseAuth, isDBError, DBErrorType } from "@/src/database";
import { createError } from "@/src/factory/error-factory";
import { createTokens } from "@/src/factory/token-factory";
import { result, error, serverError, createRequest, handleRequest, setup } from "@/src/route-utils";
import { InferContext } from "@/index";

export default createRequest().post("/auth/login", (ctx) => handleRequest(ctx, handleLogin), {
   body: t.Object({
      username: t.Optional(t.String()),
      email: t.Optional(t.String()),
      password: t.String(),
   }),
});

async function handleLogin(ctx: InferContext<typeof setup, APIPostLoginJSONBody>) {
   try {
      const user = await DatabaseAuth.userByCredentials(ctx.body);

      const [accessToken, refreshToken] = await createTokens(
         { id: user._id },
         constants.ACCESS_TOKEN_EXPIRE_TIME,
         constants.REFRESH_TOKEN_EXPIRE_TIME,
      );
      const json: APIPostLoginResult = { ...user.toObject(), token: accessToken, refreshToken: refreshToken };

      return result(ctx, json);
   } catch (e) {
      if (isDBError(e, DBErrorType.NULL_USER)) {
         return error(
            ctx,
            createError(Error.invalidFormBody()).error("login", Field.invalidLogin()).error("password", Field.invalidLogin()),
         );
      }

      return serverError(ctx, e);
   }
}
