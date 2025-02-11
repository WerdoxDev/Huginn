import { createRoute, missingAccess, singleError } from "@huginn/backend-shared";
import { ChannelType, Errors, HttpCode, MessageFlags, MessageType, idFix } from "@huginn/shared";
import { prisma } from "#database";
import { selectChannelRecipients } from "#database/common";
import { gateway } from "#setup";
import { dispatchToTopic } from "#utils/gateway-utils";
import { dispatchChannel, dispatchMessage } from "#utils/helpers";
import { verifyJwt } from "#utils/route-utils";

createRoute("PUT", "/api/channels/:channelId/recipients/:recipientId", verifyJwt(), async (c) => {
	const payload = c.get("tokenPayload");
	const { channelId, recipientId } = c.req.param();

	const channel = idFix(await prisma.channel.getById(channelId, { select: { ...selectChannelRecipients, type: true } }));
	if (channel.type !== ChannelType.GROUP_DM) {
		return singleError(c, Errors.invalidChannelType());
	}

	if (!channel.recipients.find((x) => x.id === payload.id)) {
		return missingAccess(c);
	}

	if (channel.recipients.find((x) => x.id === recipientId)) {
		return c.newResponse(null, HttpCode.NO_CONTENT);
	}

	const updatedChannel = idFix(await prisma.channel.addRecipient(channelId, recipientId, { include: selectChannelRecipients }));

	// Create read state
	await prisma.readState.createState(recipientId, channelId);

	// Dispatch recipient add event
	const addedRecipient = updatedChannel.recipients.find((x) => x.id === recipientId);
	if (addedRecipient) {
		dispatchToTopic(channelId, "channel_recipient_add", { channelId: channelId, user: addedRecipient });
	}

	// Dispatch channel create event
	gateway.subscribeSessionsToTopic(recipientId, channelId);
	dispatchChannel(updatedChannel, "channel_create", recipientId);

	await dispatchMessage(payload.id, channelId, MessageType.RECIPIENT_ADD, "", [recipientId], MessageFlags.NONE);

	return c.newResponse(null, HttpCode.NO_CONTENT);
});
