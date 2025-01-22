import { type APIGetUserChannelsResult, HttpCode, idFix, merge } from "@huginn/shared";

import { prisma } from "#database";
import { omitChannelRecipient, selectChannelRecipients } from "#database/common";

import { useVerifiedJwt } from "#utils/route-utils";

export default defineEventHandler(async (event) => {
	const { payload } = await useVerifiedJwt(event);

	const channels: APIGetUserChannelsResult = idFix(
		await prisma.channel.getUserChannels(payload.id, false, { include: merge(selectChannelRecipients, omitChannelRecipient(payload.id)) }),
	);

	setResponseStatus(event, HttpCode.OK);
	return channels;
});
