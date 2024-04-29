import { Prisma } from "@prisma/client";
import { RelationshipType } from "@shared/api-types";
import { Snowflake, snowflake } from "@shared/snowflake";
import { DBErrorType, assertBoolWithCause, assertObjectWithCause, prisma } from ".";
import { RelationshipInclude, RelationshipPayload } from "./database-common";

const relationshipExtention = Prisma.defineExtension({
   model: {
      relationship: {
         async getById<Include extends RelationshipInclude>(id: Snowflake, include?: Include) {
            const relationship = await prisma.relationship.findUnique({ where: { id: id }, include: include });

            assertObjectWithCause("getById", relationship, DBErrorType.NULL_RELATIONSHIP, id);
            return relationship as RelationshipPayload<Include>;
         },
         async getUserRelationships<Include extends RelationshipInclude>(userId: Snowflake, include?: Include) {
            await prisma.user.assertUserExists("getUserRelationships", userId);

            const relationships = await prisma.relationship.findMany({ where: { ownerId: userId }, include: include });

            assertObjectWithCause("getUserRelationships", relationships, DBErrorType.NULL_RELATIONSHIP);
            return relationships as RelationshipPayload<Include>[];
         },
         async deleteById(id: Snowflake) {
            await prisma.relationship.assertRelationshipExists("deleteById", id);

            const ownerId = (await prisma.relationship.getById(id)).ownerId;
            const relatedRelation = await prisma.relationship.findFirst({ where: { userId: ownerId } });

            assertObjectWithCause("deleteById", relatedRelation, DBErrorType.NULL_RELATIONSHIP);

            await prisma.relationship.delete({ where: { id } });
            await prisma.relationship.delete({ where: { id: relatedRelation.id } });
         },
         async createRelationship<Include extends RelationshipInclude>(
            ownerId: string,
            userId: string,
            type: RelationshipType,
            include?: Include
         ) {
            await prisma.user.assertUserExists("createRelationship", userId);
            await prisma.user.assertUserExists("createRelationship", ownerId);

            const relationship = await prisma.relationship.create({
               data: { id: snowflake.generate(), nickname: "", type, ownerId, userId, since: new Date() },
               include: include,
            });

            assertObjectWithCause("createRelationship", relationship, DBErrorType.NULL_RELATIONSHIP);
            return relationship as RelationshipPayload<Include>;
         },
         async assertRelationshipExists(methodName: string, id: Snowflake) {
            const relationshipExists = await prisma.relationship.exists({ id });
            assertBoolWithCause(methodName, !relationshipExists, DBErrorType.NULL_RELATIONSHIP, id);
         },
      },
   },
});

export default relationshipExtention;
