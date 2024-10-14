import { missingAccess, missingPermission, singleError, useValidatedParams } from "@huginn/backend-shared";
import { ChannelType, Errors, HttpCode, MessageFlags, MessageType, idFix, omit } from "@huginn/shared";
import { defineEventHandler, setResponseStatus } from "h3";
import { z } from "zod";
import { prisma } from "#database";
import { includeChannelRecipients, includeMessageAuthorAndMentions } from "#database/common";
import { gateway, router } from "#server";
import { dispatchToTopic } from "#utils/gateway-utils";
import { useVerifiedJwt } from "#utils/route-utils";

const paramsSchema = z.object({ channelId: z.string(), recipientId: z.string() });

router.delete(
	"/channels/:channelId/recipients/:recipientId",
	defineEventHandler(async (event) => {
		const { payload } = await useVerifiedJwt(event);
		const { channelId, recipientId } = await useValidatedParams(event, paramsSchema);

		await prisma.user.assertUserExists("/channels/:channelId/recipients/:recipientId", recipientId);

		const channel = idFix(await prisma.channel.getById(channelId, includeChannelRecipients));
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

		const updatedChannel = idFix(await prisma.channel.removeRecipient(channelId, recipientId, includeChannelRecipients));

		dispatchToTopic(recipientId, "channel_delete", omit(updatedChannel, ["recipients"]));
		gateway.unsubscribeSessionsFromTopic(recipientId, channelId);

		const removedRecipient = channel.recipients.find((x) => x.id === recipientId);
		if (removedRecipient) {
			dispatchToTopic(channelId, "channel_recipient_remove", {
				channelId: channelId,
				user: removedRecipient,
			});
		}

		const message = omit(
			idFix(
				await prisma.message.createDefaultMessage(
					payload.id,
					channelId,
					MessageType.RECIPIENT_REMOVE,
					"",
					undefined,
					[recipientId],
					MessageFlags.NONE,
					includeMessageAuthorAndMentions,
				),
			),
			["authorId"],
		);

		dispatchToTopic(channelId, "message_create", message);

		setResponseStatus(event, HttpCode.NO_CONTENT);
		return null;
	}),
);
