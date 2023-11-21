import { Error, Field, HttpCode } from "$shared/errors";
import { APIPostLoginJSONBody, APIPostLoginResult } from "$shared/api-types";
import { createError } from "../error-factory";
import { userByCredentials } from "../database/auth";
import { createResult } from "../result-factory";
import { createTokens } from "../token-factory";

export default async function handleLogin(req: Request): Promise<Response> {
   const json: unknown = await req.json();

   if (!json || !isLoginJsonBody(json)) {
      return createError(Error.invalidFormBody()).toResponse(HttpCode.BAD_REQUEST);
   }

   try {
      const user = await userByCredentials(json);

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

export function isLoginJsonBody(object: unknown): object is APIPostLoginJSONBody {
   if (object !== null && typeof object === "object") {
      return "password" in object && ("email" in object || "username" in object);
   }

   return false;
}
