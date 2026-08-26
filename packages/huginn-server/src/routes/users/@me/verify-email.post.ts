import { createToken, singleError } from "@huginn/backend-shared";
import { prisma, selectPrivateUser } from "@huginn/backend-shared/database/index";
import { CONSTANTS, Errors, type APIPostVerifyEmailResult } from "@huginnjs/shared";
import Elysia, { t } from "elysia";

const schema = t.Object({
   code: t.String(),
   email: t.String(),
});

export const postVerifyEmail = new Elysia().post("/api/users/@me/verify-email", { body: schema }, async ({ body, status }) => {
   const emailVerification = await prisma.emailVerification.findFirst({ where: { email: body.email } });

   if (!emailVerification || emailVerification.expiresAt.getTime() < Date.now()) {
      return singleError(Errors.emailVerificationExpired(), status, "Bad Request");
   }

   if (emailVerification?.code !== body.code) {
      return singleError(Errors.emailVerificationInvalid(), status, "Bad Request");
   }

   const userId = emailVerification.userId.toString();

   const updatedUser =
      emailVerification.purpose === "email_change"
         ? await prisma.user.edit(userId, { email: emailVerification.email }, { select: selectPrivateUser })
         : await prisma.user.getById(userId, { select: selectPrivateUser });

   await prisma.user.update({
      where: { id: BigInt(userId) },
      data: { emailVerifiedAt: new Date() },
   });

   await prisma.emailVerification.delete({ where: { id: BigInt(emailVerification.id) } });

   if (emailVerification.purpose === "registration") {
      const lastAuthenticatedAt = Date.now();
      const accessToken = await createToken("user-access", { id: userId, authType: "password", lastAuthenticatedAt }, CONSTANTS.ACCESS_TOKEN_EXPIRE_TIME);
      const refreshToken = await createToken("user-refresh", { id: userId, authType: "password", lastAuthenticatedAt }, CONSTANTS.REFRESH_TOKEN_EXPIRE_TIME);

      const json: APIPostVerifyEmailResult = {
         ...updatedUser,
         token: accessToken,
         refreshToken,
      };
      return status("OK", json);
   }

   return status("OK", updatedUser satisfies APIPostVerifyEmailResult);
});
