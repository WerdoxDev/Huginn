import { elysia, verifyJwt2 } from "@huginn/backend-shared";
import { createRelationship } from "../relationships.post";
import Elysia from "elysia";
import { Errors, RelationshipType } from "@huginn/shared";
import { prisma } from "@huginn/backend-shared/database/index";

export const putUserRelationship = new Elysia()
   .use(verifyJwt2())
   .put("/api/users/@me/relationships/:userId", async ({ tokenPayload, status, params: { userId } }) => {
      if (userId === tokenPayload.id) {
         return elysia.singleError(Errors.relationshipSelfRequest(), status, "Bad Request");
      }

      if (await prisma.relationship.exists({ ownerId: BigInt(tokenPayload.id), userId: BigInt(userId), type: RelationshipType.FRIEND })) {
         return elysia.singleError(Errors.relationshipExists(), status, "Bad Request");
      }

      await createRelationship(tokenPayload.id, userId);

      return status("No Content");
   });
