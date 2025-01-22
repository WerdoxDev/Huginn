import { missingAccess, singleError, useValidatedParams } from "@huginn/backend-shared";
import { ChannelType, Errors, HttpCode, MessageFlags, MessageType, idFix, merge } from "@huginn/shared";

import { z } from "zod";
import { prisma } from "#database";
import { selectChannelRecipients } from "#database/common";
import { gateway } from "#setup";
import { dispatchToTopic } from "#utils/gateway-utils";
import { dispatchChannel, dispatchMessage } from "#utils/helpers";
import { useVerifiedJwt } from "#utils/route-utils";

const paramsSchema = z.object({ channelId: z.string(), recipientId: z.string() });

export default defineEventHandler(async (event) => {
	const { payload } = await useVerifiedJwt(event);
	const { channelId, recipientId } = await useValidatedParams(event, paramsSchema);

	const channel = idFix(await prisma.channel.getById(channelId, { select: { ...selectChannelRecipients, type: true } }));
	if (channel.type !== ChannelType.GROUP_DM) {
		return singleError(event, Errors.invalidChannelType());
	}

	if (!channel.recipients.find((x) => x.id === payload.id)) {
		return missingAccess(event);
	}

	if (channel.recipients.find((x) => x.id === recipientId)) {
		return sendNoContent(event, HttpCode.NO_CONTENT);
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

	await dispatchMessage(payload.id, channelId, MessageType.RECIPIENT_ADD, "", undefined, [recipientId], MessageFlags.NONE);

	return sendNoContent(event, HttpCode.NO_CONTENT);
});
