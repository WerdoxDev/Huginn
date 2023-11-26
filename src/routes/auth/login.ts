import { Error, Field, HttpCode } from "@shared/errors";
import { APIPostLoginJSONBody, APIPostLoginResult } from "@shared/api-types";
import { createError } from "../../factory/error-factory";
import { userByCredentials } from "../../database/auth";
import { createResult } from "../../factory/result-factory";
import { createTokens } from "../../factory/token-factory";
import Elysia, { t } from "elysia";

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
      const user = await userByCredentials(body);

      if (!user) {
         return createError(Error.invalidFormBody())
            .error("login", Field.invalidLogin())
            .error("password", Field.invalidLogin())
            .toResponse(HttpCode.BAD_REQUEST);
      }

      const [accessToken, refreshToken] = await createTokens({ id: user._id }, "30m", "7d");
      const result: APIPostLoginResult = { ...user.toObject(), token: accessToken, refreshToken: refreshToken };

      return createResult(result, HttpCode.OK);
   } catch (e) {
      console.error(e);
      return createError().toResponse(HttpCode.SERVER_ERROR);
   }
}

export default route;
