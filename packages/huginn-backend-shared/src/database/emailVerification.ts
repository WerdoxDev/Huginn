import { Prisma } from "#prisma/client";
import { idFix, snowflake, WorkerID, type Snowflake } from "@huginn/shared";
import { assertId } from "./error";
import { assertExists, assertObj, prisma } from "#database";
import { DBErrorType } from "#types";

export const emailVerificationExtension = Prisma.defineExtension({
   model: {
      emailVerification: {
         async getByUserId(userId: Snowflake) {
            const methodName = "emailVerification.getByUserId";

            assertId(userId);
            const emailVerification = await prisma.emailVerification.findFirst({
               where: { AND: [{ userId: BigInt(userId) }, { expiresAt: { lt: new Date() } }] },
            });
            assertObj(methodName, emailVerification, DBErrorType.NULL_EMAIL_VERIFICATION, userId);

            return idFix(emailVerification);
         },
         async createOrUpdate(options: { userId: Snowflake; code: string; newEmail: string; expiresAt: number }) {
            const methodName = "emailVerification.createOne";

            try {
               assertId(options.userId);

               const emailVerification = await prisma.emailVerification.upsert({
                  create: {
                     id: snowflake.generate(WorkerID.EMAIL_VERIFICATION),
                     expiresAt: new Date(options.expiresAt),
                     newEmail: options.newEmail,
                     code: options.code,
                     userId: BigInt(options.userId),
                  },
                  update: {
                     expiresAt: new Date(options.expiresAt),
                     newEmail: options.newEmail,
                     code: options.code,
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
