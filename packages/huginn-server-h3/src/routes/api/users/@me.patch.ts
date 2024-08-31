import { router } from "@/server";
import { prisma } from "@database";
import { createErrorFactory, createHuginnError, useValidatedBody } from "@huginn/backend-shared";
import { APIPatchCurrentUserResult, CDNRoutes, constants, Errors, Fields, HttpCode, idFix, resolveBuffer } from "@huginn/shared";
import { useVerifiedJwt, getFileHash } from "@utils/route-utils";
import { cdnUpload } from "@utils/server-request";
import { createTokens } from "@utils/token-factory";
import {
   validateUsername,
   validateDisplayName,
   validateEmail,
   validateCorrectPassword,
   validateUsernameUnique,
   validateEmailUnique,
} from "@utils/validation";
import { defineEventHandler, setResponseStatus } from "h3";
import { z } from "zod";

const schema = z.object({
   email: z.optional(z.string()),
   username: z.optional(z.string()),
   displayName: z.optional(z.nullable(z.string())),
   avatar: z.optional(z.nullable(z.string())),
   password: z.optional(z.string()),
   newPassword: z.optional(z.string()),
});

router.patch(
   "/users/@me",
   defineEventHandler(async event => {
      const { payload } = await useVerifiedJwt(event);
      const body = await useValidatedBody(event, schema);

      const formError = createErrorFactory(Errors.invalidFormBody());

      validateUsername(body.username, formError);
      validateDisplayName(body.displayName, formError);
      validateEmail(body.email, formError);

      if ((body.username ?? body.newPassword) && !body.password) {
         formError.addError("password", Fields.required());
      }

      if (formError.hasErrors()) {
         return createHuginnError(event, formError);
      }

      const databaseError = createErrorFactory(Errors.invalidFormBody());

      const user = idFix(await prisma.user.getById(payload.id));
      validateCorrectPassword(body.password, user.password || "", databaseError);

      await validateUsernameUnique(body.username, databaseError);
      await validateEmailUnique(body.email, databaseError);

      if (databaseError.hasErrors()) {
         return createHuginnError(event, databaseError);
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
      // dispatchToTopic(payload.id, "user_update", { ...updatedUser, token: accessToken, refreshToken });
      // dispatchToTopic(payload.id + "_public", "public_user_update", { ...updatedUser });

      const json: APIPatchCurrentUserResult = { ...updatedUser, token: accessToken, refreshToken };
      setResponseStatus(event, HttpCode.OK);
      return json;
   }),
);
