import { createErrorFactory, createHuginnError, globalPlugin, hRateLimit, singleError, verifyToken } from "@huginn/backend-shared";
import { prisma } from "@huginn/backend-shared/database";
import { Errors, Fields } from "@huginnjs/shared";
import Elysia, { t } from "elysia";

import { gateway } from "#server";
import { consumePasswordResetCode } from "#utils/password-reset";
import { sendPasswordResetConfirmationEmail } from "#utils/route-utils";
import { validatePassword } from "#utils/validation";

export const confirmPasswordReset = new Elysia()
   .use(globalPlugin)
   .use(hRateLimit({ duration: 60_000, max: 10 }))
   .post(
      "/api/auth/password-reset/confirm",
      async ({ body, headers, status, global }) => {
         const errors = createErrorFactory(Errors.invalidFormBody());
         if (!body.newPassword) errors.addError("newPassword", Fields.required());
         else validatePassword(body.newPassword, errors, "newPassword");
         if (errors.hasErrors()) return createHuginnError(errors, status);

         let currentSessionId: bigint | undefined;
         let currentUserId: string | undefined;
         if (headers.authorization) {
            const token = /^Bearer (.+)$/i.exec(headers.authorization)?.[1];
            if (!token) return singleError(Errors.unauthorized(), status, "Unauthorized");
            const { valid, payload } = await verifyToken("user-access", token);
            if (!valid || !payload) return singleError(Errors.unauthorized(), status, "Unauthorized");
            currentSessionId = BigInt(payload.sessionId);
            currentUserId = payload.id;
         }

         const user = await prisma.user.findFirst({
            where: { email: { equals: body.email.trim(), mode: "insensitive" }, password: { not: null }, emailVerifiedAt: { not: null } },
            select: { id: true, email: true },
         });
         if (!user) return singleError(Errors.passwordResetInvalid(), status, "Bad Request");
         if (currentUserId && currentUserId !== user.id.toString()) return singleError(Errors.unauthorized(), status, "Unauthorized");

         const result = await prisma.$transaction(async (transaction) => {
            if (!(await consumePasswordResetCode(transaction, user.id.toString(), body.code))) return null;
            const passwordHash = await Bun.password.hash(body.newPassword);
            await transaction.user.update({ where: { id: user.id }, data: { password: passwordHash } });
            return transaction.authSession.updateManyAndReturn({
               where: {
                  userId: user.id,
                  authType: "password",
                  revokedAt: null,
                  ...(currentSessionId ? { id: { not: currentSessionId } } : {}),
               },
               data: { revokedAt: new Date() },
               select: { id: true },
            });
         });
         if (!result) return singleError(Errors.passwordResetInvalid(), status, "Bad Request");
         for (const session of result) gateway.revokeAuthSession(session.id.toString());
         global.waitUntil(() => sendPasswordResetConfirmationEmail(user.email));
         return status("No Content");
      },
      { body: t.Object({ email: t.String({ format: "email" }), code: t.String(), newPassword: t.String() }) },
   );
