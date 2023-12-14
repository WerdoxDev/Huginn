import Elysia, { t } from "elysia";
import { APIPatchCurrentUserJSONBody, APIPatchCurrentUserResult } from "@shared/api-types";
import { Error, Field } from "@shared/errors";
import { constants } from "@shared/constants";
import { InferContext } from "@/index";
import { DatabaseUser } from "@/src/database";
import { createError } from "@/src/factory/error-factory";
import { verifyToken, createTokens } from "@/src/factory/token-factory";
import { setup, hasToken, error, result, serverError } from "@/src/route-utils";
import {
   validateUsername,
   validateDisplayName,
   validateEmail,
   validateCorrectPassword,
   validateUsernameUnique,
   validateEmailUnique,
} from "@/src/validation";

const route = new Elysia().use(setup).patch("/users/@me", (ctx) => handlePatchCurrentUser(ctx), {
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
         return error(ctx, formError);
      }

      const databaseError = createError(Error.invalidFormBody());

      const user = await DatabaseUser.getUserById(payload!.id);
      validateCorrectPassword(ctx.body.password, user.password || "", databaseError);

      await validateUsernameUnique(ctx.body.username, databaseError);
      await validateEmailUnique(ctx.body.email, databaseError);

      if (databaseError.hasErrors()) {
         return error(ctx, databaseError);
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

      const json: APIPatchCurrentUserResult = { ...updatedUser.toObject(), token: accessToken, refreshToken };

      return result(ctx, json);
   } catch (e) {
      return serverError(ctx, e);
   }
}

export default route;
