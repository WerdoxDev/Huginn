import { missingAccess, singleError, useValidatedParams } from "@huginn/backend-shared";
import { ChannelType, Errors, HttpCode, MessageFlags, MessageType, idFix } from "@huginn/shared";
import { defineEventHandler, setResponseStatus } from "h3";
import { z } from "zod";
import { prisma } from "#database";
import { includeChannelRecipients, includeMessageAuthorAndMentions, omitMessageAuthorId } from "#database/common";
import { gateway, router } from "#server";
import { dispatchToTopic } from "#utils/gateway-utils";
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
		dispatchToTopic(recipientId, "channel_create", {
			...updatedChannel,
			recipients: updatedChannel.recipients.filter((x) => x.id !== recipientId),
		});

		const message = idFix(
			await prisma.message.createDefaultMessage(
				payload.id,
				channelId,
				MessageType.RECIPIENT_ADD,
				"",
				undefined,
				[recipientId],
				MessageFlags.NONE,
				includeMessageAuthorAndMentions,
				omitMessageAuthorId,
			),
		);

		dispatchToTopic(channelId, "message_create", message);

		setResponseStatus(event, HttpCode.NO_CONTENT);
		return null;
	}),
);
