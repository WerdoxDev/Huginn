import { analytics, idFix, recordSpanError, type Snowflake } from "@huginn/shared";

import { prisma } from "#database";
import { Prisma } from "#prisma/client";
import { DBErrorType } from "#types";

import { assertExists, assertId } from "./error";

export const notificationTokenExtension = Prisma.defineExtension({
   model: {
      notificationToken: {
         getByUserId(userId: Snowflake) {
            return analytics.startActiveSpan("db.notificationToken.getByUserId", async (span) => {
               span.setAttribute("query.user.id", userId);
               try {
                  const result = await prisma.notificationToken.findMany({ where: { userId: BigInt(userId) } });
                  span.setAttribute("notification_token.count", result.length);
                  return idFix(result);
               } catch (e) {
                  recordSpanError(e);
                  throw e;
               } finally {
                  span.end();
               }
            });
         },
         createOrUpdate(options: { userId: Snowflake; deviceId: string; token: string }) {
            return analytics.startActiveSpan("db.notificationToken.createOrUpdate", async (span) => {
               span.setAttributes({
                  "query.user.id": options.userId,
                  "query.device_id": options.deviceId,
                  "query.token_exists": !!options.token,
               });

               const methodName = "notificationToken.createOrUpdate";

               try {
                  assertId(methodName, options.userId);

                  const notificationToken = await prisma.notificationToken.upsert({
                     where: { deviceId: options.deviceId },
                     create: { deviceId: options.deviceId, token: options.token, userId: BigInt(options.userId) },
                     update: { token: options.token },
                  });

                  span.setAttribute("notification_token.device_id", notificationToken.deviceId);
               } catch (e) {
                  recordSpanError(e);
                  assertExists(e, methodName, DBErrorType.NULL_USER, [options.userId]);
                  throw e;
               } finally {
                  span.end();
               }
            });
         },
      },
   },
});
