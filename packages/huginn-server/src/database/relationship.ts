import { Prisma } from "@prisma/client";
import { RelationshipType } from "@huginn/shared";
import { Snowflake, snowflake } from "@huginn/shared";
import { DBErrorType, assertCondition, assertId, assertObj, prisma } from ".";
import { RelationshipInclude, RelationshipPayload } from "./common";

const relationshipExtention = Prisma.defineExtension({
   model: {
      relationship: {
         async getByUserId<Include extends RelationshipInclude>(ownerId: Snowflake, userId: Snowflake, include?: Include) {
            assertId("getByUserId", ownerId, userId);

            const relationship = await prisma.relationship.findFirst({
               where: { ownerId: BigInt(ownerId), userId: BigInt(userId) },
               include: include,
            });

            assertObj("getById", relationship, DBErrorType.NULL_RELATIONSHIP, `${ownerId}, ${userId}`);
            return relationship as RelationshipPayload<Include>;
         },
         async getUserRelationships<Include extends RelationshipInclude>(userId: Snowflake, include?: Include) {
            await prisma.user.assertUserExists("getUserRelationships", userId);

            const relationships = await prisma.relationship.findMany({ where: { ownerId: BigInt(userId) }, include: include });

            assertObj("getUserRelationships", relationships, DBErrorType.NULL_RELATIONSHIP);
            return relationships as RelationshipPayload<Include>[];
         },
         async deleteByUserId(ownerId: Snowflake, userId: Snowflake) {
            assertId("deleteByUserId", ownerId, userId);

            const relation = await prisma.relationship.findFirst({ where: { userId: BigInt(userId), ownerId: BigInt(ownerId) } });
            assertObj("deleteByUserId", relation, DBErrorType.NULL_RELATIONSHIP);

            const oppositeRelation = await prisma.relationship.findFirst({
               where: { userId: BigInt(ownerId), ownerId: BigInt(userId) },
            });
            assertObj("deleteByUserId", oppositeRelation, DBErrorType.NULL_RELATIONSHIP);

            const deleteRelation = prisma.relationship.delete({ where: { id: relation?.id } });
            const deleteOppositeRelation = prisma.relationship.delete({ where: { id: oppositeRelation?.id } });

            await prisma.$transaction([deleteRelation, deleteOppositeRelation]);
         },
         async createRelationship<Include extends RelationshipInclude>(senderId: string, recieverId: string, include?: Include) {
            await prisma.user.assertUserExists("createRelationship", senderId);
            await prisma.user.assertUserExists("createRelationship", recieverId);

            const incomingExists = await prisma.relationship.exists({
               ownerId: BigInt(senderId),
               userId: BigInt(recieverId),
               type: RelationshipType.PENDING_INCOMING,
            });

            if (incomingExists) {
               await prisma.relationship.updateMany({
                  where: {
                     OR: [
                        { ownerId: BigInt(senderId), userId: BigInt(recieverId) },
                        { ownerId: BigInt(recieverId), userId: BigInt(senderId) },
                     ],
                  },
                  data: { type: RelationshipType.FRIEND, since: new Date() },
               });

               const relationships = await prisma.relationship.findMany({
                  where: {
                     OR: [
                        { ownerId: BigInt(senderId), userId: BigInt(recieverId) },
                        { ownerId: BigInt(recieverId), userId: BigInt(senderId) },
                     ],
                  },
                  include: include,
               });

               return relationships as RelationshipPayload<Include>[];
            }

            const createOutgoing = prisma.relationship.create({
               data: {
                  id: snowflake.generate(),
                  nickname: "",
                  type: RelationshipType.PENDING_OUTGOING,
                  ownerId: BigInt(senderId),
                  userId: BigInt(recieverId),
                  since: null,
               },
               include: include,
            });

            const createIncoming = prisma.relationship.create({
               data: {
                  id: snowflake.generate(),
                  nickname: "",
                  type: RelationshipType.PENDING_INCOMING,
                  ownerId: BigInt(recieverId),
                  userId: BigInt(senderId),
                  since: null,
               },
               include: include,
            });

            const relationships = await prisma.$transaction([createOutgoing, createIncoming]);

            assertObj("createRelationship", relationships, DBErrorType.NULL_RELATIONSHIP);

            return relationships as RelationshipPayload<Include>[];
         },
         async assertRelationshipExists(methodName: string, id: Snowflake) {
            assertId(methodName, id);
            const relationshipExists = await prisma.relationship.exists({ id: BigInt(id) });
            assertCondition(methodName, !relationshipExists, DBErrorType.NULL_RELATIONSHIP, id);
         },
      },
   },
});

export default relationshipExtention;
