import { DBErrorType } from "@huginn/backend-shared/types";
import { RelationshipType, type Snowflake, WorkerID, idFix, snowflake } from "@huginn/shared";
import { Prisma } from "@prisma/client";
import { assertExists, assertId, assertObj, prisma, type RelationshipArgs, type RelationshipPayload } from ".";

export const relationshipExtension = Prisma.defineExtension({
   model: {
      relationship: {
         async getByUserId<Args extends RelationshipArgs>(ownerId: Snowflake, userId: Snowflake, args?: Args) {
            const methodName = "relationship.getByUserId";
            assertId(methodName, ownerId, userId);

            const relationship = await prisma.relationship.findFirst({
               where: { ownerId: BigInt(ownerId), userId: BigInt(userId) },
               ...args,
            });

            assertObj(methodName, relationship, DBErrorType.NULL_RELATIONSHIP, `${ownerId}, ${userId}`);
            return idFix(relationship) as RelationshipPayload<Args>;
         },
         async getUserRelationships<Args extends RelationshipArgs>(userId: Snowflake, args?: Args) {
            const methodName = "relationship.getUserRelationships";

            try {
               assertId(methodName, userId);
               const relationships = await prisma.relationship.findMany({
                  where: { ownerId: BigInt(userId) },
                  ...args,
               });

               assertObj(methodName, relationships, DBErrorType.NULL_RELATIONSHIP);
               return idFix(relationships) as RelationshipPayload<Args>[];
            } catch (e) {
               await assertExists(e, methodName, DBErrorType.NULL_USER, [userId]);
               throw e;
            }
         },
         async deleteByUserId(ownerId: Snowflake, userId: Snowflake) {
            const methodName = "relationship.deleteByUserId";

            assertId(methodName, ownerId, userId);

            const relation = await prisma.relationship.findFirst({ where: { userId: BigInt(userId), ownerId: BigInt(ownerId) } });
            assertObj(methodName, relation, DBErrorType.NULL_RELATIONSHIP, `${ownerId}>${userId}`);

            const oppositeRelation = await prisma.relationship.findFirst({
               where: { userId: BigInt(ownerId), ownerId: BigInt(userId) },
            });
            assertObj(methodName, oppositeRelation, DBErrorType.NULL_RELATIONSHIP, `${userId}>${ownerId}`);

            const deleteRelation = prisma.relationship.delete({ where: { id: relation?.id } });
            const deleteOppositeRelation = prisma.relationship.delete({ where: { id: oppositeRelation?.id } });

            await prisma.$transaction([deleteRelation, deleteOppositeRelation]);
         },
         async createOne<Args extends RelationshipArgs>(senderId: Snowflake, receiverId: Snowflake, args?: Args) {
            const methodName = "relationship.createOne";

            try {
               assertId(methodName, senderId, receiverId);

               const incomingExists = await prisma.relationship.exists({
                  ownerId: BigInt(senderId),
                  userId: BigInt(receiverId),
                  type: RelationshipType.PENDING_INCOMING,
               });

               if (incomingExists) {
                  await prisma.relationship.updateMany({
                     where: {
                        OR: [
                           { ownerId: BigInt(senderId), userId: BigInt(receiverId) },
                           { ownerId: BigInt(receiverId), userId: BigInt(senderId) },
                        ],
                     },
                     data: { type: RelationshipType.FRIEND, since: new Date() },
                  });

                  const relationships = await prisma.relationship.findMany({
                     where: {
                        OR: [
                           { ownerId: BigInt(senderId), userId: BigInt(receiverId) },
                           { ownerId: BigInt(receiverId), userId: BigInt(senderId) },
                        ],
                     },
                     ...args,
                  });

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

               assertObj(methodName, relationships, DBErrorType.NULL_RELATIONSHIP);

               return idFix(relationships) as RelationshipPayload<Args>[];
            } catch (e) {
               await assertExists(e, methodName, DBErrorType.NULL_USER, [senderId, receiverId]);
               throw e;
            }
         },
      },
   },
});
