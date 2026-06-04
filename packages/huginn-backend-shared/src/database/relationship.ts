import { RelationshipType, analytics, type Snowflake, WorkerID, idFix, snowflake, recordSpanError } from "@huginn/shared";

import { assertExists, assertId, assertObj, prisma, type RelationshipArgs, type RelationshipPayload, Prisma } from "#database";
import { DBErrorType } from "#types";

export const relationshipExtension = Prisma.defineExtension({
   model: {
      relationship: {
         async getByUserId<Args extends RelationshipArgs>(ownerId: Snowflake, userId: Snowflake, args?: Args) {
            return analytics.startActiveSpan("db.relationship.getByUserId", async (span) => {
               span.setAttributes({ "query.owner.id": ownerId, "query.user.id": userId });
               const methodName = "relationship.getByUserId";
               assertId(methodName, ownerId, userId);

               try {
                  const relationship = await prisma.relationship.findFirst({
                     where: { ownerId: BigInt(ownerId), userId: BigInt(userId) },
                     ...args,
                  });

                  span.setAttribute("relationship.exists", !!relationship);

                  assertObj(methodName, relationship, DBErrorType.NULL_RELATIONSHIP, `${ownerId}, ${userId}`);
                  return idFix(relationship) as RelationshipPayload<Args>;
               } catch (e) {
                  recordSpanError(e as Error);
                  throw e;
               } finally {
                  span.end();
               }
            });
         },
         async getUserRelationships<Args extends RelationshipArgs>(userId: Snowflake, args?: Args) {
            return analytics.startActiveSpan("db.relationship.getUserRelationships", async (span) => {
               span.setAttribute("query.user.id", userId);
               const methodName = "relationship.getUserRelationships";

               try {
                  assertId(methodName, userId);
                  const relationships = await prisma.relationship.findMany({
                     where: { ownerId: BigInt(userId) },
                     ...args,
                  });

                  span.setAttribute("relationships.count", relationships.length);
                  assertObj(methodName, relationships, DBErrorType.NULL_RELATIONSHIP);
                  return idFix(relationships) as RelationshipPayload<Args>[];
               } catch (e) {
                  recordSpanError(e as Error);
                  await assertExists(e, methodName, DBErrorType.NULL_USER, [userId]);
                  throw e;
               } finally {
                  span.end();
               }
            });
         },
         async deleteByUserId(ownerId: Snowflake, userId: Snowflake) {
            return analytics.startActiveSpan("db.relationship.deleteByUserId", async (span) => {
               span.setAttributes({ "query.owner.id": ownerId, "query.user.id": userId });
               const methodName = "relationship.deleteByUserId";

               try {
                  assertId(methodName, ownerId, userId);

                  const relation = await prisma.relationship.findFirst({
                     where: { userId: BigInt(userId), ownerId: BigInt(ownerId) },
                  });

                  span.setAttribute("relationship.exists", !!relation);
                  assertObj(methodName, relation, DBErrorType.NULL_RELATIONSHIP, `${ownerId}>${userId}`);

                  const oppositeRelation = await prisma.relationship.findFirst({
                     where: { userId: BigInt(ownerId), ownerId: BigInt(userId) },
                  });
                  span.setAttribute("opposite_relationship.exists", !!oppositeRelation);
                  assertObj(methodName, oppositeRelation, DBErrorType.NULL_RELATIONSHIP, `${userId}>${ownerId}`);

                  const deleteRelation = prisma.relationship.delete({ where: { id: relation?.id } });
                  const deleteOppositeRelation = prisma.relationship.delete({
                     where: { id: oppositeRelation?.id },
                  });

                  await prisma.$transaction([deleteRelation, deleteOppositeRelation]);
               } catch (e) {
                  recordSpanError(e as Error);
                  throw e;
               } finally {
                  span.end();
               }
            });
         },
         async createOne<Args extends RelationshipArgs>(senderId: Snowflake, receiverId: Snowflake, args?: Args) {
            return analytics.startActiveSpan("db.relationship.createOne", async (span) => {
               span.setAttributes({ "query.sender.id": senderId, "query.receiver.id": receiverId });
               const methodName = "relationship.createOne";

               try {
                  assertId(methodName, senderId, receiverId);

                  const incomingExists = await prisma.relationship.exists({
                     ownerId: BigInt(senderId),
                     userId: BigInt(receiverId),
                     type: RelationshipType.PENDING_INCOMING,
                  });

                  span.setAttribute("incoming_relationship.exists", incomingExists);

                  if (incomingExists) {
                     const updateResult = await prisma.relationship.updateMany({
                        where: {
                           OR: [
                              { ownerId: BigInt(senderId), userId: BigInt(receiverId) },
                              { ownerId: BigInt(receiverId), userId: BigInt(senderId) },
                           ],
                        },
                        data: { type: RelationshipType.FRIEND, since: new Date() },
                     });

                     span.setAttribute("updated_relationships.count", updateResult.count);

                     const relationships = await prisma.relationship.findMany({
                        where: {
                           OR: [
                              { ownerId: BigInt(senderId), userId: BigInt(receiverId) },
                              { ownerId: BigInt(receiverId), userId: BigInt(senderId) },
                           ],
                        },
                        ...args,
                     });

                     span.setAttribute("relationships.count", relationships.length);

                     return idFix(relationships) as RelationshipPayload<Args>[];
                  }

                  const relationships = await prisma.relationship.createManyAndReturn({
                     data: [
                        {
                           id: snowflake.generate(WorkerID.RELATIONSHIP),
                           nickname: "",
                           type: RelationshipType.PENDING_INCOMING,
                           ownerId: BigInt(receiverId),
                           userId: BigInt(senderId),
                           since: null,
                        },
                        {
                           id: snowflake.generate(WorkerID.RELATIONSHIP),
                           nickname: "",
                           type: RelationshipType.PENDING_OUTGOING,
                           ownerId: BigInt(senderId),
                           userId: BigInt(receiverId),
                           since: null,
                        },
                     ],
                     ...args,
                  });

                  span.setAttribute("relationships.count", relationships.length);
                  assertObj(methodName, relationships, DBErrorType.NULL_RELATIONSHIP);

                  return idFix(relationships) as RelationshipPayload<Args>[];
               } catch (e) {
                  recordSpanError(e as Error);
                  await assertExists(e, methodName, DBErrorType.NULL_USER, [senderId, receiverId]);
                  throw e;
               } finally {
                  span.end();
               }
            });
         },
      },
   },
});
