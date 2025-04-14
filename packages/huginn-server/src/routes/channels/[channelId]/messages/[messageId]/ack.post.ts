import { createRoute } from "@huginn/backend-shared";
import { prisma } from "@huginn/backend-shared/database";
import { HttpCode } from "@huginn/shared";
import { dispatchToTopic } from "#utils/gateway-utils";
import { verifyJwt } from "#utils/route-utils";

createRoute("POST", "/api/channels/:channelId/messages/:messageId/ack", verifyJwt(), async (c) => {
	const payload = c.get("tokenPayload");
	const { channelId, messageId } = c.req.param();

	await prisma.readState.updateLastRead(payload.id, channelId, messageId);
	dispatchToTopic(payload.id, "message_ack", { channelId, messageId });

	return c.newResponse(null, HttpCode.NO_CONTENT);
});
