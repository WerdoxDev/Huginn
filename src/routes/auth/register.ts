import { APIPostRegisterResult, APIPostRegisterJSONBody } from "@shared/api-types";
import { HttpCode, Error } from "@shared/errors";
import Elysia, { t } from "elysia";
import { constants } from "@shared/constants";
import { createError } from "../../factory/error-factory";
import { createResult } from "../../factory/result-factory";
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

   validateUsername(body.username, formError);
   validateDisplayName(body.displayName, formError);
   validatePassword(body.password, formError);
   validateEmail(body.email, formError);

   if (formError.hasErrors()) {
      return formError.toResponse(HttpCode.BAD_REQUEST);
   }

   try {
      const databaseError = createError(Error.invalidFormBody());

      await validateUsernameUnique(body.username, databaseError);
      await validateEmailUnique(body.email, databaseError);

      if (databaseError.hasErrors()) {
         return databaseError.toResponse(HttpCode.BAD_REQUEST);
      }

      const user = await DatabaseAuth.registerNewUser(body);

      const [accessToken, refreshToken] = await createTokens(
         { id: user._id },
         constants.ACCESS_TOKEN_EXPIRE_TIME,
         constants.REFRESH_TOKEN_EXPIRE_TIME
      );
      const result: APIPostRegisterResult = { ...user.toObject(), token: accessToken, refreshToken: refreshToken };

      return createResult(result, HttpCode.CREATED);
   } catch (e) {
      return createError().toResponse(HttpCode.SERVER_ERROR);
   }
}

export default route;
