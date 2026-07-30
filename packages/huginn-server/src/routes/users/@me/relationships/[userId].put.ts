import { singleError, verifyJwt } from "@huginn/backend-shared";
import { prisma } from "@huginn/backend-shared/database/index";
import { Errors, RelationshipType } from "@huginnjs/shared";
import Elysia from "elysia";

import { createRelationship } from "../relationships.post";

export const putUserRelationship = new Elysia()
   .use(verifyJwt())
   .put("/api/users/@me/relationships/:userId", async ({ tokenPayload, status, params: { userId } }) => {
      if (userId === tokenPayload.id) {
         return singleError(Errors.relationshipSelfRequest(), status, "Bad Request");
      }

      if (
         await prisma.relationship.exists({
            ownerId: BigInt(tokenPayload.id),
            userId: BigInt(userId),
            type: RelationshipType.FRIEND,
         })
      ) {
         return singleError(Errors.relationshipExists(), status, "Bad Request");
      }

      await createRelationship(tokenPayload.id, userId);

      return status("No Content");
   });
