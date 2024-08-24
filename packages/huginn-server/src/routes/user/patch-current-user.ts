import { prisma } from "@/db";
import { createTokens } from "@/factory/token-factory";
import { dispatchToTopic } from "@/gateway/gateway-utils";
import { getFileHash, getJwt, hValidator, handleRequest, verifyJwt } from "@/route-utils";
import { cdnUpload } from "@/server-request";
import {
   validateCorrectPassword,
   validateDisplayName,
   validateEmail,
   validateEmailUnique,
   validateUsername,
   validateUsernameUnique,
} from "@/validation";
import { createError, errorResponse } from "@huginn/backend-shared";
import { APIPatchCurrentUserResult, CDNRoutes, Error, Field, HttpCode, constants, idFix, resolveBuffer } from "@huginn/shared";
import { Hono } from "hono";
import { z } from "zod";

const schema = z.object({
   email: z.optional(z.string()),
   username: z.optional(z.string()),
   displayName: z.optional(z.nullable(z.string())),
   avatar: z.optional(z.nullable(z.string())),
   password: z.optional(z.string()),
   newPassword: z.optional(z.string()),
});

const app = new Hono();

app.patch("/users/@me", verifyJwt(), hValidator("json", schema), c =>
   handleRequest(c, async () => {
      const body = c.req.valid("json");
      const payload = getJwt(c);

      const formError = createError(Error.invalidFormBody());

      validateUsername(body.username, formError);
      validateDisplayName(body.displayName, formError);
      validateEmail(body.email, formError);

      if ((body.username ?? body.newPassword) && !body.password) {
         formError.addError("password", Field.required());
      }

      if (formError.hasErrors()) {
         return errorResponse(c, formError);
      }

      const databaseError = createError(Error.invalidFormBody());

      const user = idFix(await prisma.user.getById(payload.id));
      validateCorrectPassword(body.password, user.password || "", databaseError);

      await validateUsernameUnique(body.username, databaseError);
      await validateEmailUnique(body.email, databaseError);

      if (databaseError.hasErrors()) {
         return errorResponse(c, databaseError);
      }

      let avatarHash: string | undefined | null = undefined;
      if (body.avatar !== null && body.avatar !== undefined) {
         const data = resolveBuffer(body.avatar);
         avatarHash = getFileHash(data);

         await cdnUpload(CDNRoutes.uploadAvatar(user.id), {
            files: [{ data: resolveBuffer(body.avatar), name: avatarHash }],
         });
      } else if (body.avatar === null) {
         avatarHash = null;
      }

      const updatedUser = idFix(
         await prisma.user.edit(payload.id, {
            email: body.email,
            username: body.username,
            displayName: !body.displayName ? null : body.displayName,
            avatar: avatarHash,
            password: body.newPassword,
         }),
      );

      const [accessToken, refreshToken] = await createTokens(
         { id: payload.id },
         constants.ACCESS_TOKEN_EXPIRE_TIME,
         constants.REFRESH_TOKEN_EXPIRE_TIME,
      );

      // TODO: When guilds are a thing, this should send an update to users that are viewing that guild
      dispatchToTopic(payload.id, "user_update", { ...updatedUser, token: accessToken, refreshToken });
      dispatchToTopic(payload.id + "_public", "public_user_update", { ...updatedUser });

      const json: APIPatchCurrentUserResult = { ...updatedUser, token: accessToken, refreshToken };

      return c.json(json, HttpCode.OK);
   }),
);

export default app;
