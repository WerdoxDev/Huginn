import { Error, Field, HttpCode } from "@shared/errors";
import { APIPostLoginJSONBody, APIPostLoginResult } from "@shared/api-types";
import { createError } from "../../factory/error-factory";
import { createResult } from "../../factory/result-factory";
import { createTokens } from "../../factory/token-factory";
import Elysia, { t } from "elysia";
import { constants } from "@shared/constants";
import { DatabaseAuth, DBErrorType, isDBError } from "../../database";

const route = new Elysia();

route.post("/login", ({ body }) => handleLogin(body), {
   body: t.Object({
      username: t.Optional(t.String()),
      email: t.Optional(t.String()),
      password: t.String(),
   }),
});

async function handleLogin(body: APIPostLoginJSONBody): Promise<Response> {
   try {
      const user = await DatabaseAuth.userByCredentials(body);

      const [accessToken, refreshToken] = await createTokens(
         { id: user._id },
         constants.ACCESS_TOKEN_EXPIRE_TIME,
         constants.REFRESH_TOKEN_EXPIRE_TIME
      );
      const result: APIPostLoginResult = { ...user.toObject(), token: accessToken, refreshToken: refreshToken };

      return createResult(result, HttpCode.OK);
   } catch (e) {
      if (isDBError(e) && e.error.message === DBErrorType.NULL_USER) {
         return createError(Error.invalidFormBody())
            .error("login", Field.invalidLogin())
            .error("password", Field.invalidLogin())
            .toResponse(HttpCode.BAD_REQUEST);
      }

      return createError().toResponse(HttpCode.SERVER_ERROR);
   }
}

export default route;
