import { Prisma } from "@prisma/client";
import { RelationshipType } from "@shared/api-types";
import { Snowflake, snowflake } from "@shared/snowflake";
import { DBErrorType, assertBoolWithCause, assertObjectWithCause, prisma } from ".";
import { RelationshipInclude, RelationshipPayload } from "./database-common";

const relationshipExtention = Prisma.defineExtension({
   model: {
      relationship: {
         async getByUserId<Include extends RelationshipInclude>(ownerId: Snowflake, userId: Snowflake, include?: Include) {
            const relationship = await prisma.relationship.findFirst({ where: { ownerId, userId }, include: include });

            assertObjectWithCause("getById", relationship, DBErrorType.NULL_RELATIONSHIP, `${ownerId}-${userId}`);
            return relationship as RelationshipPayload<Include>;
         },
         async getUserRelationships<Include extends RelationshipInclude>(userId: Snowflake, include?: Include) {
            await prisma.user.assertUserExists("getUserRelationships", userId);

            const relationships = await prisma.relationship.findMany({ where: { ownerId: userId }, include: include });

            assertObjectWithCause("getUserRelationships", relationships, DBErrorType.NULL_RELATIONSHIP);
            return relationships as RelationshipPayload<Include>[];
         },
         async deleteByUserId(ownerId: Snowflake, userId: Snowflake) {
            const relation = await prisma.relationship.findFirst({ where: { userId: userId, ownerId: ownerId } });
            assertObjectWithCause("deleteByUserId", relation, DBErrorType.NULL_RELATIONSHIP);

            const oppositeRelation = await prisma.relationship.findFirst({ where: { userId: ownerId, ownerId: userId } });
            assertObjectWithCause("deleteByUserId", oppositeRelation, DBErrorType.NULL_RELATIONSHIP);

            const deleteRelation = prisma.relationship.delete({ where: { id: relation.id } });
            const deleteOppositeRelation = prisma.relationship.delete({ where: { id: oppositeRelation.id } });

            await prisma.$transaction([deleteRelation, deleteOppositeRelation]);
         },
         async createRelationship<Include extends RelationshipInclude>(senderId: string, recieverId: string, include?: Include) {
            await prisma.user.assertUserExists("createRelationship", senderId);
            await prisma.user.assertUserExists("createRelationship", recieverId);

            const incomingExists = await prisma.relationship.exists({
               ownerId: senderId,
               userId: recieverId,
               type: RelationshipType.PENDING_INCOMING,
            });

            if (incomingExists) {
               await prisma.relationship.updateMany({
                  where: {
                     OR: [
                        { ownerId: senderId, userId: recieverId },
                        { ownerId: recieverId, userId: senderId },
                     ],
                  },
                  data: { type: RelationshipType.FRIEND, since: new Date() },
               });

               const relationships = await prisma.relationship.findMany({
                  where: {
                     OR: [
                        { ownerId: senderId, userId: recieverId },
                        { ownerId: recieverId, userId: senderId },
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
                  ownerId: senderId,
                  userId: recieverId,
                  since: null,
               },
               include: include,
            });

            const createIncoming = prisma.relationship.create({
               data: {
                  id: snowflake.generate(),
                  nickname: "",
                  type: RelationshipType.PENDING_INCOMING,
                  ownerId: recieverId,
                  userId: senderId,
                  since: null,
               },
               include: include,
            });

            const relationships = await prisma.$transaction([createOutgoing, createIncoming]);

            assertObjectWithCause("createRelationship", relationships, DBErrorType.NULL_RELATIONSHIP);

            return relationships as RelationshipPayload<Include>[];
         },
         async assertRelationshipExists(methodName: string, id: Snowflake) {
            const relationshipExists = await prisma.relationship.exists({ id });
            assertBoolWithCause(methodName, !relationshipExists, DBErrorType.NULL_RELATIONSHIP, id);
         },
      },
   },
});

export default relationshipExtention;
