import { Prisma } from "@prisma/client";
import { RelationshipType } from "@shared/api-types";
import { snowflake } from "@shared/snowflake";
import { DBErrorType, assertObjectWithCause, prisma } from ".";
import { RelationshipInclude, RelationshipPayload } from "./database-common";

const relationshipExtention = Prisma.defineExtension({
   model: {
      relationship: {
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
      },
   },
});

export default relationshipExtention;
