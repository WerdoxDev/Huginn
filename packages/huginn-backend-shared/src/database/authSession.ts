import { analytics, idFix, recordSpanError, type Snowflake } from "@huginnjs/shared";

import { assertExists, prisma, Prisma, selectAuthSession } from "#database";
import { DBErrorType } from "#types";

export const authSessionExtension = Prisma.defineExtension({
   model: {
      authSession: {
         getUserSessions(userId: Snowflake) {
            return analytics.startActiveSpan("db.authSession.getUserSessions", async (span) => {
               const methodName = "authSession.getUserSessions";
               span.setAttributes({
                  "query.user.id": userId.toString(),
               });

               try {
                  const sessions = await prisma.authSession.findMany({
                     where: { userId: BigInt(userId), revokedAt: null, expiresAt: { gt: new Date() } },
                     orderBy: { lastSeenAt: "desc" },
                     select: selectAuthSession,
                  });

                  span.setAttribute("auth_session.count", sessions.length);
                  return idFix(sessions);
               } catch (e) {
                  recordSpanError(e);
                  assertExists(e, methodName, DBErrorType.NULL_USER, [userId]);
                  throw e;
               }
            });
         },
         revokeSession(sessionId: Snowflake, userId: Snowflake) {
            return analytics.startActiveSpan("db.authSession.revokeSession", async (span) => {
               const methodName = "authSession.revokeSession";
               span.setAttributes({
                  "query.session.id": sessionId.toString(),
                  "query.user.id": userId.toString(),
               });

               try {
                  const result = await prisma.authSession.updateMany({
                     where: { id: BigInt(sessionId), userId: BigInt(userId), revokedAt: null },
                     data: { revokedAt: new Date() },
                  });

                  span.setAttribute("auth_session.revoked", result.count === 1);
                  return result.count === 1;
               } catch (e) {
                  recordSpanError(e);
                  assertExists(e, methodName, DBErrorType.NULL_USER, [userId]);
                  throw e;
               }
            });
         },
      },
   },
});
