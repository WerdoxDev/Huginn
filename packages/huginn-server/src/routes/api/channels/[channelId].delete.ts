import { missingAccess, useValidatedParams } from "@huginn/backend-shared";
import { type APIDeleteDMChannelResult, ChannelType, HttpCode, idFix } from "@huginn/shared";
import { defineEventHandler, setResponseStatus } from "h3";
import { z } from "zod";
import { prisma } from "#database";
import { includeChannelRecipients } from "#database/common";
import { gateway, router } from "#server";
import { dispatchToTopic } from "#utils/gateway-utils";
import { useVerifiedJwt } from "#utils/route-utils";

const schema = z.object({ channelId: z.string() });

router.delete(
	"/channels/:channelId",
	defineEventHandler(async (event) => {
		const { payload } = await useVerifiedJwt(event);
		const { channelId } = await useValidatedParams(event, schema);

		const channel = idFix(await prisma.channel.getById(channelId, includeChannelRecipients));

		if (!(await prisma.user.hasChannel(payload.id, channelId))) {
			return missingAccess(event);
		}

		const deletedChannel: APIDeleteDMChannelResult = idFix(await prisma.channel.deleteDM(channelId, payload.id, includeChannelRecipients));

		dispatchToTopic(payload.id, "channel_delete", channel);

		const removedRecipient = channel.recipients.find((x) => x.id === payload.id);
		if (channel.type === ChannelType.GROUP_DM && removedRecipient) {
			dispatchToTopic(channelId, "channel_recipient_remove", { channelId: channelId, user: removedRecipient });
			gateway.unsubscribeSessionsFromTopic(payload.id, channelId);
		}

		setResponseStatus(event, HttpCode.OK);
		return deletedChannel;
	}),
);
