import { APIPostRegisterResult, APIPostRegisterJSONBody } from "$shared/api-types";
import { HttpCode, Error, Field } from "$shared/errors";
import { constants } from "../constants";
import { registerNewUser } from "../database/auth";
import { existsInUsers } from "../database/common";
import { createError } from "../error-factory";
import { createResult } from "../result-factory";
import { createTokens } from "../token-factory";

export default async function handleRegister(req: Request): Promise<Response> {
   if (req.method !== "POST") {
      return createError().toResponse(HttpCode.METHOD_NOT_ALLOWED);
   }

   if (!req.body) {
      return createError(Error.invalidFormBody()).toResponse(HttpCode.BAD_REQUEST);
   }

   const json = await req.json();

   if (!json || !isRegisterJsonBody(json)) {
      return createError(Error.invalidFormBody()).toResponse(HttpCode.BAD_REQUEST);
   }

   if (!json.username || !json.email || !json.password) {
      return createError(Error.invalidFormBody()).toResponse(HttpCode.BAD_REQUEST);
   }

   const formError = createError(Error.invalidFormBody());

   if (json.username.length < constants.USERNAME_MIN_LENGTH || json.username.length > constants.USERNAME_MAX_LENGTH) {
      formError.error("username", Field.tooShort(constants.USERNAME_MIN_LENGTH, constants.USERNAME_MAX_LENGTH));
   }

   if (json.password.length < constants.PASSWORD_MIN_LENGTH) {
      formError.error("password", Field.tooShort(constants.PASSWORD_MIN_LENGTH));
   }

   if (!json.email.match(constants.EMAIL_REGEX)) {
      formError.error("email", Field.emailInvalid());
   }

   if (formError.hasErrors()) return formError.toResponse(HttpCode.BAD_REQUEST);

   try {
      const databaseError = createError(Error.invalidFormBody());

      if (await existsInUsers("username", json.username)) {
         databaseError.error("username", Field.usernameTaken());
      }

      if (await existsInUsers("email", json.email)) {
         databaseError.error("email", Field.emailInUse());
      }

      if (databaseError.hasErrors()) return databaseError.toResponse(HttpCode.BAD_REQUEST);

      const user = await registerNewUser(json);

      if (!user) {
         return createError().toResponse(HttpCode.SERVER_ERROR);
      }

      const [accessToken, refreshToken] = await createTokens({ id: user._id }, "30m", "7d");
      const result: APIPostRegisterResult = { ...user.toObject(), token: accessToken, refreshToken: refreshToken };

      return createResult(result, HttpCode.CREATED);
   } catch (e) {
      console.error(e);
      return createError().toResponse(HttpCode.SERVER_ERROR);
   }
}

function isRegisterJsonBody(object: unknown): object is APIPostRegisterJSONBody {
   if (object !== null && typeof object === "object") {
      return "username" in object && "displayName" in object && "email" in object && "password" in object;
   }

   return false;
}
