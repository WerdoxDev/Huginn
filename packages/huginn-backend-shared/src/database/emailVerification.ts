import { analytics, idFix, recordSpanError, snowflake, WorkerID, type EmailVerificationPurpose, type Snowflake } from "@huginn/shared";

import { assertExists, prisma } from "#database";
import { Prisma } from "#prisma/client";
import { DBErrorType } from "#types";

import { assertId } from "./error";

export const emailVerificationExtension = Prisma.defineExtension({
   model: {
      emailVerification: {
         async getByUserId(userId: Snowflake) {
            return analytics.startActiveSpan("db.emailVerification.getByUserId", async (span) => {
               span.setAttribute("query.user.id", userId);
               try {
                  assertId(userId);
                  const emailVerification = await prisma.emailVerification.findFirst({
                     where: { userId: BigInt(userId) },
                  });

                  span.setAttribute("email_verification.exists", !!emailVerification);

                  return idFix(emailVerification);
               } catch (e) {
                  recordSpanError(e);
                  throw e;
               }
            });
         },
         async createOrUpdate(options: { userId: Snowflake; code: string; email: string; expiresAt: number; purpose: EmailVerificationPurpose }) {
            return analytics.startActiveSpan("db.emailVerification.createOrUpdate", async (span) => {
               span.setAttributes({
                  "query.user.id": options.userId,
                  "query.purpose": options.purpose,
                  "query.has_email": !!options.email,
               });

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

                  span.setAttribute("email_verification.id", emailVerification.id.toString());

                  return emailVerification;
               } catch (e) {
                  recordSpanError(e);
                  assertExists(e, methodName, DBErrorType.NULL_USER, [options.userId]);
                  throw e;
               }
            });
         },
      },
   },
});
