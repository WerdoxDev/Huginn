import { createRoute, missingAccess, missingPermission, singleError } from "@huginn/backend-shared";
import { ChannelType, Errors, HttpCode, MessageFlags, MessageType, idFix } from "@huginn/shared";
import { prisma } from "#database";
import { selectChannelRecipients } from "#database/common";
import { gateway } from "#setup";
import { dispatchToTopic } from "#utils/gateway-utils";
import { dispatchMessage } from "#utils/helpers";
import { verifyJwt } from "#utils/route-utils";

createRoute("DELETE", "/api/channels/:channelId/recipients/:recipientId", verifyJwt(), async (c) => {
	const payload = c.get("tokenPayload");
	const { channelId, recipientId } = c.req.param();

	await prisma.user.assertUsersExist("/channels/:channelId/recipients/:recipientId", [recipientId]);

	const channel = idFix(await prisma.channel.getById(channelId, { select: { ...selectChannelRecipients, type: true, ownerId: true } }));
	if (!channel.recipients.find((x) => x.id === payload.id)) {
		return missingAccess(c);
	}

	if (channel.type !== ChannelType.GROUP_DM) {
		return singleError(c, Errors.invalidChannelType());
	}

	if (channel.ownerId !== payload.id) {
		return missingPermission(c);
	}

	if (!channel.recipients.find((x) => x.id === recipientId)) {
		return singleError(c, Errors.invalidRecipient(recipientId), HttpCode.NOT_FOUND);
	}

	const updatedChannel = idFix(await prisma.channel.removeRecipient(channelId, recipientId));

	// Delete read state
	await prisma.readState.deleteState(recipientId, channelId);

	// Dispatch channel delete event
	dispatchToTopic(recipientId, "channel_delete", updatedChannel);
	gateway.unsubscribeSessionsFromTopic(recipientId, channelId);

	const removedRecipient = channel.recipients.find((x) => x.id === recipientId);
	if (removedRecipient) {
		dispatchToTopic(channelId, "channel_recipient_remove", {
			channelId: channelId,
			user: removedRecipient,
		});
	}

	await dispatchMessage(payload.id, channelId, MessageType.RECIPIENT_REMOVE, "", undefined, [recipientId], MessageFlags.NONE);

	return c.newResponse(null, HttpCode.NO_CONTENT);
});
