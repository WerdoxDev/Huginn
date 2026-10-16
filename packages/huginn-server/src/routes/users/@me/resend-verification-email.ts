import { globalPlugin, hRateLimit, singleError, verifyJwt } from "@huginn/backend-shared";
import { prisma } from "@huginn/backend-shared/database/index";
import { CONSTANTS, Errors, type EmailVerificationPurpose } from "@huginnjs/shared";
import Elysia from "elysia";

import { issueEmailVerificationCode } from "#utils/email-verification";
import { sendEmailVerificationEmail } from "#utils/route-utils";

export const postResendVerificationEmail = new Elysia()
   .use(verifyJwt())
   .use(hRateLimit({ duration: CONSTANTS.EMAIL_VERIFICATION_RESEND_COOLDOWN, max: 1 }))
   .use(globalPlugin)
   .post("/api/users/@me/resend-verification-email", async ({ tokenPayload, status, global }) => {
      const emailVerification = await prisma.emailVerification.findUnique({ where: { userId: BigInt(tokenPayload.id) } });

      if (!emailVerification) {
         return singleError(Errors.emailVerificationNotFound(), status, "Not Found");
      }

      const code = await issueEmailVerificationCode(tokenPayload.id, emailVerification.email, emailVerification.purpose as EmailVerificationPurpose);

      global.waitUntil(async () => await sendEmailVerificationEmail(emailVerification.email, code));

      return status("OK");
   });
