import { globalPlugin, hRateLimit } from "@huginn/backend-shared";
import { prisma } from "@huginn/backend-shared/database";
import Elysia, { t } from "elysia";

import { issuePasswordResetCode } from "#utils/password-reset";
import { sendPasswordResetEmail } from "#utils/route-utils";

export const requestPasswordReset = new Elysia()
   .use(globalPlugin)
   .use(hRateLimit({ duration: 60_000, max: 5 }))
   .post(
      "/api/auth/password-reset/request",
      async ({ body, status, global }) => {
         global.waitUntil(async () => {
            const user = await prisma.user.findUnique({
               where: { email: body.email.trim().toLowerCase() },
               select: { id: true, email: true, password: true, emailVerifiedAt: true },
            });
            if (user?.password && user.emailVerifiedAt) {
               const code = await issuePasswordResetCode(user.id.toString());
               await sendPasswordResetEmail(user.email, code);
            }
         });
         return status("Accepted");
      },
      { body: t.Object({ email: t.String({ format: "email" }) }) },
   );
