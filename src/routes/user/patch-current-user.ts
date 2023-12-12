import Elysia, { t } from "elysia";
import { hasToken, logAndReturnError, returnError, returnResult, setup } from "../../route-utils";
import { APIPatchCurrentUserJSONBody, APIPatchCurrentUserResult } from "@shared/api-types";
import { Error, Field } from "@shared/errors";
import { createError } from "../../factory/error-factory";
import { createTokens, verifyToken } from "../../factory/token-factory";
import { constants } from "@shared/constants";
import { DatabaseUser } from "../../database";
import {
   validateDisplayName,
   validateEmail,
   validateCorrectPassword,
   validateUsername,
   validateUsernameUnique,
   validateEmailUnique,
} from "../../validation";
import { InferContext } from "../../..";

const route = new Elysia().use(setup).patch("/@me", (ctx) => handlePatchCurrentUser(ctx), {
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

async function handlePatchCurrentUser(ctx: InferContext<typeof setup, APIPatchCurrentUserJSONBody>) {
   try {
      const [_isValid, payload] = await verifyToken(ctx.bearer!);

      const formError = createError(Error.invalidFormBody());

      validateUsername(ctx.body.username, formError);
      validateDisplayName(ctx.body.displayName, formError);
      validateEmail(ctx.body.email, formError);

      if ((ctx.body.username || ctx.body.newPassword) && !ctx.body.password) {
         formError.error("password", Field.required());
      }

      if (formError.hasErrors()) {
         return returnError(ctx, formError);
      }

      const databaseError = createError(Error.invalidFormBody());

      const user = await DatabaseUser.getUserById(payload!.id);
      validateCorrectPassword(ctx.body.password, user.password || "", databaseError);

      await validateUsernameUnique(ctx.body.username, databaseError);
      await validateEmailUnique(ctx.body.email, databaseError);

      if (databaseError.hasErrors()) {
         return returnError(ctx, databaseError);
      }

      const updatedUser = await DatabaseUser.updateUser(payload!.id, {
         email: ctx.body.email,
         username: ctx.body.username,
         displayName: ctx.body.displayName,
         avatar: ctx.body.avatar,
         password: ctx.body.newPassword,
      });

      const [accessToken, refreshToken] = await createTokens(
         { id: payload!.id },
         constants.ACCESS_TOKEN_EXPIRE_TIME,
         constants.REFRESH_TOKEN_EXPIRE_TIME,
      );

      const result: APIPatchCurrentUserResult = { ...updatedUser.toObject(), token: accessToken, refreshToken };

      return returnResult(ctx, result);
   } catch (e) {
      return logAndReturnError(ctx, e);
   }
}

export default route;
