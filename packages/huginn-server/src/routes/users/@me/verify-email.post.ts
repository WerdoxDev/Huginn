import { globalPlugin, hRateLimit, singleError } from "@huginn/backend-shared";
import { prisma, selectPrivateUser } from "@huginn/backend-shared/database/index";
import { Errors, idFix, type APIPostVerifyEmailResult } from "@huginnjs/shared";
import Elysia, { t } from "elysia";

import { createAuthSession } from "#utils/auth-session";
import { consumeEmailVerificationCode } from "#utils/email-verification";

const schema = t.Object({
   code: t.String(),
   email: t.String(),
});

export const postVerifyEmail = new Elysia()
   .use(globalPlugin)
   .use(hRateLimit({ duration: 60_000, max: 10 }))
   .post(
      "/api/users/@me/verify-email",
      async ({ body, status, request }) => {
         const emailVerification = await prisma.emailVerification.findFirst({
            where: { email: { equals: body.email.trim(), mode: "insensitive" } },
         });

         if (!emailVerification || emailVerification.expiresAt.getTime() < Date.now()) {
            return singleError(Errors.emailVerificationExpired(), status, "Bad Request");
         }

         const userId = emailVerification.userId.toString();
         const updatedUser = await prisma.$transaction(async (transaction) => {
            if (!(await consumeEmailVerificationCode(transaction, emailVerification, body.code))) return null;

            // If email is changed, delete all password reset codes with it.
            if (emailVerification.purpose === "email_change") {
               await transaction.passwordReset.deleteMany({ where: { userId: emailVerification.userId } });
            }

            return transaction.user.update({
               where: { id: emailVerification.userId },
               data: {
                  emailVerifiedAt: new Date(),
                  ...(emailVerification.purpose === "email_change" ? { email: emailVerification.email } : {}),
               },
               select: selectPrivateUser,
            });
         });

         if (!updatedUser) return singleError(Errors.emailVerificationInvalid(), status, "Bad Request");
         const user = idFix(updatedUser);

         if (emailVerification.purpose === "registration") {
            const tokens = await createAuthSession(userId, "password", undefined, request.headers.get("user-agent") ?? undefined);

            const json: APIPostVerifyEmailResult = {
               ...user,
               ...tokens,
            };
            return status("OK", json);
         }

         return status("OK", user satisfies APIPostVerifyEmailResult);
      },
      { body: schema },
   );
