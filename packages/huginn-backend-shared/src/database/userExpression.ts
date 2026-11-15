import { analytics, idFix, recordSpanError, type APIExpressionReference, type ExpressionKind, type Snowflake } from "@huginnjs/shared";

import { assertExists, assertId, prisma } from "#database";
import { Prisma } from "#prisma/client";
import { DBErrorType } from "#types";

export const userExpressionExtension = Prisma.defineExtension({
   model: {
      userExpression: {
         async createUserExpression(userId: Snowflake, kind: ExpressionKind, media: APIExpressionReference) {
            return analytics.startActiveSpan("db.userExpression.createUserExpression", async (span) => {
               span.setAttributes({
                  "query.user.id": userId,
                  "query.expression.kind": kind,
                  "query.expression.type": media.type,
                  "query.expression.id": media.id,
               });

               const methodName = "userExpression.createUserExpression";
               try {
                  assertId(methodName, userId);

                  const key = { userId: BigInt(userId), kind, type: media.type, expressionId: media.id };
                  const expression = await prisma.userExpression.upsert({ where: { userId_kind_type_expressionId: key }, create: key, update: {} });

                  return idFix(expression);
               } catch (e) {
                  recordSpanError(e);
                  await assertExists(e, methodName, DBErrorType.NULL_USER, [userId]);
                  throw e;
               }
            });
         },
         /** Only successful sends count as usage; repeated references in a message count once. */
         async recordUsage(userId: Snowflake, kind: ExpressionKind, refs: APIExpressionReference[]) {
            return analytics.startActiveSpan("db.userExpression.recordUsage", async (span) => {
               span.setAttributes({
                  "query.user.id": userId,
                  "query.expression.kind": kind,
               });

               const methodName = "userExpression.recordUsage";
               try {
                  assertId(methodName, userId);

                  const unique = [...new Map(refs.map((ref) => [`${ref.type}:${ref.id}`, ref])).values()];
                  span.setAttribute("expressions.count", unique.length);

                  return await Promise.all(
                     unique.map((ref) => {
                        const key = { userId: BigInt(userId), kind, type: ref.type, expressionId: ref.id };
                        return prisma.userExpression.upsert({
                           where: { userId_kind_type_expressionId: key },
                           create: { ...key, usageCount: 1, lastUsedAt: new Date() },
                           update: { usageCount: { increment: 1 }, lastUsedAt: new Date() },
                           include: { expression: true },
                        });
                     }),
                  );
               } catch (e) {
                  recordSpanError(e);
                  await assertExists(e, methodName, DBErrorType.NULL_USER, [userId]);
                  throw e;
               }
            });
         },
      },
   },
});
