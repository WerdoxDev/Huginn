import { missingAccess, missingPermission, singleError, useValidatedParams } from "@huginn/backend-shared";
import { ChannelType, Errors, HttpCode, MessageFlags, MessageType, idFix, merge, omit } from "@huginn/shared";

import { z } from "zod";
import { prisma } from "#database";
import { omitMessageAuthorId, selectChannelRecipients, selectMessageDefaults } from "#database/common";
import { gateway } from "#setup";
import { dispatchToTopic } from "#utils/gateway-utils";
import { dispatchMessage } from "#utils/helpers";
import { useVerifiedJwt } from "#utils/route-utils";

const paramsSchema = z.object({ channelId: z.string(), recipientId: z.string() });

export default defineEventHandler(async (event) => {
	const { payload } = await useVerifiedJwt(event);
	const { channelId, recipientId } = await useValidatedParams(event, paramsSchema);

	await prisma.user.assertUsersExist("/channels/:channelId/recipients/:recipientId", [recipientId]);

	const channel = idFix(await prisma.channel.getById(channelId, { select: { ...selectChannelRecipients, type: true, ownerId: true } }));
	if (!channel.recipients.find((x) => x.id === payload.id)) {
		return missingAccess(event);
	}

	if (channel.type !== ChannelType.GROUP_DM) {
		return singleError(event, Errors.invalidChannelType());
	}

	if (channel.ownerId !== payload.id) {
		return missingPermission(event);
	}

	if (!channel.recipients.find((x) => x.id === recipientId)) {
		return singleError(event, Errors.invalidRecipient(recipientId), HttpCode.NOT_FOUND);
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

	return sendNoContent(event, HttpCode.NO_CONTENT);
});
