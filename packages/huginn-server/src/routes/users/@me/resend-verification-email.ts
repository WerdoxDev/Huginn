import { generateVerificationCode, sendVerificationEmail } from "#utils/route-utils";
import { globalPlugin, hRateLimit, singleError, verifyJwt } from "@huginn/backend-shared";
import { prisma } from "@huginn/backend-shared/database/index";
import { CONSTANTS, Errors, type EmailVerificationPurpose } from "@huginn/shared";
import Elysia from "elysia";

export const postResendVerificationEmail = new Elysia()
   .use(verifyJwt())
   .use(hRateLimit({ duration: CONSTANTS.EMAIL_VERIFICATION_RESEND_COOLDOWN, max: 1 }))
   .use(globalPlugin)
   .post("/api/users/@me/resend-verification-email", async ({ tokenPayload, status, global }) => {
      const emailVerification = await prisma.emailVerification.getByUserId(tokenPayload.id);

      if (!emailVerification) {
         return singleError(Errors.emailVerificationNotFound(), status, "Not Found");
      }

      const expiresAt = Date.now() + CONSTANTS.EMAIL_VERIFICATION_WINDOW;
      const code = generateVerificationCode();
      await prisma.emailVerification.createOrUpdate({
         userId: tokenPayload.id,
         code: code,
         email: emailVerification.email,
         expiresAt: expiresAt,
         purpose: emailVerification.purpose as EmailVerificationPurpose,
      });

      global.waitUntil(async () => await sendVerificationEmail(emailVerification.email, code));

      return status("OK");
   });
