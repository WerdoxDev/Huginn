import { createRoute } from "@huginn/backend-shared";
import { prisma } from "@huginn/backend-shared/database";
import { HttpCode } from "@huginn/shared";
import { gateway } from "#setup";
import { dispatchToTopic } from "#utils/gateway-utils";
import { verifyJwt } from "#utils/route-utils";

createRoute("DELETE", "/api/users/@me/relationships/:userId", verifyJwt(), async (c) => {
	const payload = c.get("tokenPayload");
	const { userId } = c.req.param();

	await prisma.relationship.deleteByUserId(payload.id, userId);

	dispatchToTopic(payload.id, "relationship_remove", userId);
	dispatchToTopic(userId, "relationship_remove", payload.id);

	gateway.presenceManeger.sendToUser(payload.id, userId, true);
	gateway.presenceManeger.sendToUser(userId, payload.id, true);

	gateway.unsubscribeSessionsFromTopic(payload.id, `${userId}_public`);
	gateway.unsubscribeSessionsFromTopic(payload.id, `${userId}_presence`);

	gateway.unsubscribeSessionsFromTopic(userId, `${payload.id}_public`);
	gateway.unsubscribeSessionsFromTopic(userId, `${payload.id}_presence`);

	return c.newResponse(null, HttpCode.NO_CONTENT);
});
