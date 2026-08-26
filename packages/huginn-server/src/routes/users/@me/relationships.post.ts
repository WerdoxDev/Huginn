import { singleError, tryCatch, verifyJwt } from "@huginn/backend-shared";
import { assertError, prisma } from "@huginn/backend-shared/database";
import { selectRelationshipUser } from "@huginn/backend-shared/database/common";
import { DBErrorType } from "@huginn/backend-shared/types";
import { Errors, omit, RelationshipType, type Snowflake } from "@huginnjs/shared";
import Elysia, { t } from "elysia";

import { gateway } from "#server";
import { dispatchToTopic } from "#utils/gateway-utils";

const schema = t.Object({ username: t.String({ minLength: 1 }) });

export const postUserRelationship = new Elysia()
   .use(verifyJwt())
   .post("/api/users/@me/relationships", { body: schema }, async ({ body, tokenPayload, status }) => {
      const [error, userId] = await tryCatch(async () => (await prisma.user.getByUsername(body.username)).id);

      if (assertError(error, DBErrorType.NULL_USER)) {
         return singleError(Errors.noUserWithUsername(), status, "Not Found");
      }
      if (error) throw error;

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

export async function createRelationship(payloadId: Snowflake, userId: Snowflake) {
   if (
      !(await prisma.relationship.exists({
         ownerId: BigInt(payloadId),
         userId: BigInt(userId),
         type: RelationshipType.PENDING_OUTGOING,
      }))
   ) {
      const relationships = await prisma.relationship.createOne(payloadId, userId, {
         include: { ...selectRelationshipUser },
         omit: { userId: true },
      });

      const relationshipOwner = relationships.find((x) => x.ownerId === payloadId);
      const relationshipUser = relationships.find((x) => x.ownerId === userId);

      if (relationshipOwner && relationshipUser) {
         dispatchToTopic(payloadId, "relationship_add", omit(relationshipOwner, ["ownerId"]));
         dispatchToTopic(userId, "relationship_add", omit(relationshipUser, ["ownerId"]));

         gateway.subscribeSessionsToTopic(payloadId, `${userId}_public`);
         gateway.subscribeSessionsToTopic(userId, `${payloadId}_public`);

         if (relationshipOwner.type === RelationshipType.FRIEND && relationshipUser.type === RelationshipType.FRIEND) {
            gateway.subscribeSessionsToTopic(payloadId, `${userId}_presence`);
            gateway.subscribeSessionsToTopic(userId, `${payloadId}_presence`);

            gateway.presenceManager.sendToUser(payloadId, userId);
            gateway.presenceManager.sendToUser(userId, payloadId);
         }
      }
   }
}
