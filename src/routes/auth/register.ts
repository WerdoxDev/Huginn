import { APIPostRegisterResult, APIPostRegisterJSONBody } from "$shared/api-types";
import { HttpCode, Error, Field } from "$shared/errors";
import Elysia, { t } from "elysia";
import { constants } from "../../constants";
import { registerNewUser } from "../../database/auth";
import { existsInUsers } from "../../database/common";
import { createError } from "../../factory/error-factory";
import { createResult } from "../../factory/result-factory";
import { createTokens } from "../../factory/token-factory";

const route = new Elysia();

route.post("/register", ({ body }) => handleRegister(body), {
   body: t.Object({
      username: t.String(),
      displayName: t.String(),
      email: t.String(),
      password: t.String(),
   }),
});

async function handleRegister(body: APIPostRegisterJSONBody): Promise<Response> {
   const formError = createError(Error.invalidFormBody());

   //TODO: change (tooShort) to something like (wrongLength)
   if (body.username.length < constants.USERNAME_MIN_LENGTH || body.username.length > constants.USERNAME_MAX_LENGTH) {
      formError.error("username", Field.tooShort(constants.USERNAME_MIN_LENGTH, constants.USERNAME_MAX_LENGTH));
   }

   if (body.password.length < constants.PASSWORD_MIN_LENGTH) {
      formError.error("password", Field.tooShort(constants.PASSWORD_MIN_LENGTH));
   }

   if (!body.email.match(constants.EMAIL_REGEX)) {
      formError.error("email", Field.emailInvalid());
   }

   if (formError.hasErrors()) return formError.toResponse(HttpCode.BAD_REQUEST);

   try {
      const databaseError = createError(Error.invalidFormBody());

      if (await existsInUsers("username", body.username)) {
         databaseError.error("username", Field.usernameTaken());
      }

      if (await existsInUsers("email", body.email)) {
         databaseError.error("email", Field.emailInUse());
      }

      if (databaseError.hasErrors()) return databaseError.toResponse(HttpCode.BAD_REQUEST);

      const user = await registerNewUser(body);

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

export default route;
