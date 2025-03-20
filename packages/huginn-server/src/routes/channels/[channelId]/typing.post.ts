import { createRoute } from "@huginn/backend-shared";
import { prisma } from "@huginn/backend-shared/database";
import { omitChannelRecipient, selectChannelRecipients } from "@huginn/backend-shared/database/common";
import { HttpCode, idFix, merge } from "@huginn/shared";
import { dispatchToTopic } from "#utils/gateway-utils";
import { verifyJwt } from "#utils/route-utils";

createRoute("POST", "/api/channels/:channelId/typing", verifyJwt(), async (c) => {
	const payload = c.get("tokenPayload");
	const { channelId } = c.req.param();

	const channel = idFix(await prisma.channel.getById(channelId, { select: merge(selectChannelRecipients, omitChannelRecipient(payload.id)) }));

	for (const recipient of channel.recipients) {
		dispatchToTopic(recipient.id, "typying_start", { channelId, userId: payload.id, timestamp: Date.now() });
	}

	return c.newResponse(null, HttpCode.NO_CONTENT);
});
