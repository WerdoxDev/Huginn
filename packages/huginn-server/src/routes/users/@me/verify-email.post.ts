import { DBErrorType, singleError, tryCatch, verifyJwt } from "@huginn/backend-shared";
import { assertError, prisma, selectPrivateUser } from "@huginn/backend-shared/database/index";
import { Errors, type APIPostVerifyEmailResult } from "@huginn/shared";
import Elysia, { t } from "elysia";

const schema = t.Object({ code: t.String() });

export const postVerifyEmail = new Elysia().use(verifyJwt()).post(
   "/api/users/@me/verify-email",
   async ({ body, tokenPayload, status }) => {
      const emailVerification = await prisma.emailVerification.getByUserId(tokenPayload.id);

      if (!emailVerification || emailVerification.expiresAt.getTime() < Date.now()) {
         return singleError(Errors.emailVerificationExpired(), status, "Bad Request");
      }

      if (emailVerification?.code !== body.code) {
         return singleError(Errors.emailVerificationInvalid(), status, "Bad Request");
      }

      const updatedUser = await prisma.user.edit(tokenPayload.id, { email: emailVerification.newEmail }, { select: selectPrivateUser });
      await prisma.emailVerification.delete({ where: { id: BigInt(emailVerification.id) } });

      return status("OK", updatedUser satisfies APIPostVerifyEmailResult);
   },
   { body: schema },
);
