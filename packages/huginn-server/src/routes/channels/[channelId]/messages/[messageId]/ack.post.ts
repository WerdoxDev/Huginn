import { createRoute } from "@huginn/backend-shared";
import { HttpCode } from "@huginn/shared";
import { prisma } from "#database";
import { dispatchToTopic } from "#utils/gateway-utils";
import { verifyJwt } from "#utils/route-utils";

createRoute("POST", "/api/channels/:channelId/messages/:messageId/ack", verifyJwt(), async (c) => {
	const payload = c.get("tokenPayload");
	const { channelId, messageId } = c.req.param();

	await prisma.readState.updateLastRead(payload.id, channelId, messageId);
	dispatchToTopic(payload.id, "message_ack", { channelId, messageId });

	return c.newResponse(null, HttpCode.OK);
});
