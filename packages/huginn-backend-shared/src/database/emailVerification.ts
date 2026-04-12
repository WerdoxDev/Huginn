import { assertExists, prisma } from "#database";
import { Prisma } from "#prisma/client";
import { DBErrorType } from "#types";
import { idFix, snowflake, WorkerID, type EmailVerificationPurpose, type Snowflake } from "@huginn/shared";

import { assertId } from "./error";

export const emailVerificationExtension = Prisma.defineExtension({
   model: {
      emailVerification: {
         async getByUserId(userId: Snowflake) {
            assertId(userId);
            const emailVerification = await prisma.emailVerification.findFirst({
               where: { userId: BigInt(userId) },
            });

            return idFix(emailVerification);
         },
         async createOrUpdate(options: { userId: Snowflake; code: string; email: string; expiresAt: number; purpose: EmailVerificationPurpose }) {
            const methodName = "emailVerification.createOne";

            try {
               assertId(options.userId);

               const emailVerification = await prisma.emailVerification.upsert({
                  create: {
                     id: snowflake.generate(WorkerID.EMAIL_VERIFICATION),
                     expiresAt: new Date(options.expiresAt),
                     email: options.email,
                     code: options.code,
                     userId: BigInt(options.userId),
                     purpose: options.purpose,
                  },
                  update: {
                     expiresAt: new Date(options.expiresAt),
                     email: options.email,
                     code: options.code,
                     purpose: options.purpose,
                  },
                  where: { userId: BigInt(options.userId) },
               });

               return emailVerification;
            } catch (e) {
               assertExists(e, methodName, DBErrorType.NULL_USER, [options.userId]);
               throw e;
            }
         },
      },
   },
});
