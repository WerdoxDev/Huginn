import Elysia, { t } from "elysia";
import { hasToken, setup } from "../../route-utils";
import { APIPatchCurrentUserJSONBody, APIPatchCurrentUserResult } from "@shared/api-types";
import { HttpCode, Error, Field } from "@shared/errors";
import { createError } from "../../factory/error-factory";
import { createTokens, verifyToken } from "../../factory/token-factory";
import { constants } from "@shared/constants";
import { DatabaseUser } from "../../database";
import { createResult } from "../../factory/result-factory";
import {
   validateDisplayName,
   validateEmail,
   validateCorrectPassword,
   validateUsername,
   validateUsernameUnique,
   validateEmailUnique,
} from "../../validation";

const route = new Elysia().use(setup);

route.patch("/@me", ({ bearer, body }) => handlePatchCurrentUser(bearer || "", body), {
   beforeHandle: hasToken,
   body: t.Object({
      email: t.Optional(t.String()),
      username: t.Optional(t.String()),
      displayName: t.Optional(t.String()),
      avatar: t.Optional(t.String()),
      password: t.Optional(t.String()),
      newPassword: t.Optional(t.String()),
   }),
});

async function handlePatchCurrentUser(token: string, body: APIPatchCurrentUserJSONBody) {
   try {
      const [isValid, payload] = await verifyToken(token);

      if (!isValid || !payload) {
         return createError().toResponse(HttpCode.UNAUTHORIZED);
      }

      const formError = createError(Error.invalidFormBody());

      validateUsername(body.username, formError);
      validateDisplayName(body.displayName, formError);
      validateEmail(body.email, formError);

      if ((body.username || body.newPassword) && !body.password) {
         formError.error("password", Field.required());
      }

      if (formError.hasErrors()) {
         return formError.toResponse(HttpCode.BAD_REQUEST);
      }

      const databaseError = createError(Error.invalidFormBody());

      const user = await DatabaseUser.getUserById(payload.id);
      validateCorrectPassword(body.password, user.password || "", databaseError);

      await validateUsernameUnique(body.username, databaseError);
      await validateEmailUnique(body.email, databaseError);

      if (databaseError.hasErrors()) {
         return databaseError.toResponse(HttpCode.BAD_REQUEST);
      }

      const updatedUser = await DatabaseUser.updateUser(payload.id, {
         email: body.email,
         username: body.username,
         displayName: body.displayName,
         avatar: body.avatar,
         password: body.newPassword,
      });

      const [accessToken, refreshToken] = await createTokens(
         { id: payload.id },
         constants.ACCESS_TOKEN_EXPIRE_TIME,
         constants.REFRESH_TOKEN_EXPIRE_TIME
      );

      const result: APIPatchCurrentUserResult = { ...updatedUser.toObject(), token: accessToken, refreshToken };

      return createResult(result, HttpCode.OK);
   } catch (e) {
      return createError().toResponse(HttpCode.SERVER_ERROR);
   }
}

export default route;
