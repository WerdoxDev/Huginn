import { missingAccess, useValidatedParams } from "@huginn/backend-shared";
import { type APIGetChannelByIdResult, ChannelType, HttpCode, idFix, merge, omit } from "@huginn/shared";

import { z } from "zod";
import { prisma } from "#database";
import { omitChannelRecipient, selectChannelRecipients } from "#database/common";
import { useVerifiedJwt } from "#utils/route-utils";

const schema = z.object({ channelId: z.string() });

export default defineEventHandler(async (event) => {
	const { payload } = await useVerifiedJwt(event);
	const { channelId } = await useValidatedParams(event, schema);

	const channel: APIGetChannelByIdResult = idFix(
		await prisma.channel.getById(channelId, { include: merge(selectChannelRecipients, omitChannelRecipient(payload.id)) }),
	);

	if (!(await prisma.user.hasChannel(payload.id, channelId))) {
		return missingAccess(event);
	}

	let finalChannel: APIGetChannelByIdResult;

	if (channel.type === ChannelType.DM) {
		finalChannel = omit(channel, ["icon", "name", "ownerId"]);
	} else {
		finalChannel = channel;
	}

	setResponseStatus(event, HttpCode.OK);
	return finalChannel;
});
