import { verifyJwt } from "@huginn/backend-shared";
import { prisma } from "@huginn/backend-shared/database";
import { gateway } from "#setup";
import { dispatchToTopic } from "#utils/gateway-utils";
import Elysia from "elysia";

export const deleteUserRelationship = new Elysia()
   .use(verifyJwt())
   .delete("/api/users/@me/relationships/:userId", async ({ tokenPayload, params: { userId }, status }) => {
      await prisma.relationship.deleteByUserId(tokenPayload.id, userId);

      dispatchToTopic(tokenPayload.id, "relationship_remove", userId);
      dispatchToTopic(userId, "relationship_remove", tokenPayload.id);

      gateway.presenceManager.sendToUser(tokenPayload.id, userId, true);
      gateway.presenceManager.sendToUser(userId, tokenPayload.id, true);

      gateway.unsubscribeSessionsFromTopic(tokenPayload.id, `${userId}_public`);
      gateway.unsubscribeSessionsFromTopic(tokenPayload.id, `${userId}_presence`);

      gateway.unsubscribeSessionsFromTopic(userId, `${tokenPayload.id}_public`);
      gateway.unsubscribeSessionsFromTopic(userId, `${tokenPayload.id}_presence`);

      return status("No Content");
   });
