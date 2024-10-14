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

		const channel: APIDeleteDMChannelResult = idFix(await prisma.channel.deleteDM(channelId, payload.id, includeChannelRecipients));

		if (!(await prisma.user.hasChannel(payload.id, channelId))) {
			return missingAccess(event);
		}

		dispatchToTopic(payload.id, "channel_delete", channel);

		if (channel.type === ChannelType.GROUP_DM) {
			gateway.unsubscribeSessionsFromTopic(payload.id, channel.id);
		}

		setResponseStatus(event, HttpCode.OK);
		return channel;
	}),
);
