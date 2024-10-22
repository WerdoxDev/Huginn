import { missingAccess, singleError, useValidatedParams } from "@huginn/backend-shared";
import { ChannelType, Errors, HttpCode, MessageFlags, MessageType, idFix } from "@huginn/shared";
import { defineEventHandler, setResponseStatus } from "h3";
import { z } from "zod";
import { prisma } from "#database";
import { includeChannelRecipients, includeMessageAuthorAndMentions, omitMessageAuthorId } from "#database/common";
import { gateway, router } from "#server";
import { dispatchToTopic } from "#utils/gateway-utils";
import { dispatchChannel, dispatchMessage } from "#utils/helpers";
import { useVerifiedJwt } from "#utils/route-utils";

const paramsSchema = z.object({ channelId: z.string(), recipientId: z.string() });

router.put(
	"/channels/:channelId/recipients/:recipientId",
	defineEventHandler(async (event) => {
		const { payload } = await useVerifiedJwt(event);
		const { channelId, recipientId } = await useValidatedParams(event, paramsSchema);

		const channel = idFix(await prisma.channel.getById(channelId, includeChannelRecipients));
		if (channel.type !== ChannelType.GROUP_DM) {
			return singleError(event, Errors.invalidChannelType());
		}

		if (!channel.recipients.find((x) => x.id === payload.id)) {
			return missingAccess(event);
		}

		if (channel.recipients.find((x) => x.id === recipientId)) {
			setResponseStatus(event, HttpCode.NO_CONTENT);
			return null;
		}

		const updatedChannel = idFix(await prisma.channel.addRecipient(channelId, recipientId, includeChannelRecipients));

		const addedRecipient = updatedChannel.recipients.find((x) => x.id === recipientId);
		if (addedRecipient) {
			dispatchToTopic(channelId, "channel_recipient_add", { channelId: channelId, user: addedRecipient });
		}

		gateway.subscribeSessionsToTopic(recipientId, channelId);
		dispatchChannel(updatedChannel, "channel_create", recipientId);

		await dispatchMessage(payload.id, channelId, MessageType.RECIPIENT_ADD, "", undefined, [recipientId], MessageFlags.NONE);

		setResponseStatus(event, HttpCode.NO_CONTENT);
		return null;
	}),
);
