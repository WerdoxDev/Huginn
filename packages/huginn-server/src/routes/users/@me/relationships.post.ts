import { createErrorFactory, createHuginnError, createRoute, invalidFormBody, singleError, tryCatch, validator } from "@huginn/backend-shared";
import { assertError, prisma } from "@huginn/backend-shared/database";
import { selectRelationshipUser } from "@huginn/backend-shared/database/common";
import { DBErrorType } from "@huginn/backend-shared/types";
import { Errors, HttpCode, omit, RelationshipType, type Snowflake } from "@huginn/shared";
import type { Context } from "hono";
import { z } from "zod";
import { gateway } from "#setup";
import { dispatchToTopic } from "#utils/gateway-utils";
import { verifyJwt } from "#utils/route-utils";

const schema = z.object({ username: z.string() });

createRoute("POST", "/api/users/@me/relationships", verifyJwt(), validator("json", schema), async (c) => {
   const body = c.req.valid("json");

   if (!body.username) {
      return invalidFormBody(c);
   }

   const [error, userId] = await tryCatch(async () => (await prisma.user.getByUsername(body.username)).id);

   if (assertError(error, DBErrorType.NULL_USER)) {
      return singleError(c, Errors.noUserWithUsername(), HttpCode.NOT_FOUND);
   }
   if (error) throw error;

   return relationshipPost(c, userId);
});

export async function relationshipPost(c: Context, userId: Snowflake) {
   const payload = c.get("tokenPayload");

   if (userId === payload.id) {
      return singleError(c, Errors.relationshipSelfRequest(), HttpCode.BAD_REQUEST);
   }

   if (await prisma.relationship.exists({ ownerId: BigInt(payload.id), userId: BigInt(userId), type: RelationshipType.FRIEND })) {
      return singleError(c, Errors.relationshipExists(), HttpCode.BAD_REQUEST);
   }

   if (
      !(await prisma.relationship.exists({
         ownerId: BigInt(payload.id),
         userId: BigInt(userId),
         type: RelationshipType.PENDING_OUTGOING,
      }))
   ) {
      const relationships = await prisma.relationship.createRelationship(payload.id, userId, {
         include: { ...selectRelationshipUser },
         omit: { userId: true },
      });

      const relationshipOwner = relationships.find((x) => x.ownerId === payload.id);
      const relationshipUser = relationships.find((x) => x.ownerId === userId);

      if (relationshipOwner && relationshipUser) {
         dispatchToTopic(payload.id, "relationship_add", omit(relationshipOwner, ["ownerId"]));
         dispatchToTopic(userId, "relationship_add", omit(relationshipUser, ["ownerId"]));

         gateway.subscribeSessionsToTopic(payload.id, `${userId}_public`);
         gateway.subscribeSessionsToTopic(userId, `${payload.id}_public`);

         if (relationshipOwner.type === RelationshipType.FRIEND && relationshipUser.type === RelationshipType.FRIEND) {
            gateway.subscribeSessionsToTopic(payload.id, `${userId}_presence`);
            gateway.subscribeSessionsToTopic(userId, `${payload.id}_presence`);

            gateway.presenceManager.sendToUser(payload.id, userId);
            gateway.presenceManager.sendToUser(userId, payload.id);
         }
      }
   }

   return c.newResponse(null, HttpCode.NO_CONTENT);
}
