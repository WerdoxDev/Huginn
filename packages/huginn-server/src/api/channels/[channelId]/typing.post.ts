import { useValidatedParams } from "@huginn/backend-shared";
import { HttpCode, idFix, merge, omit } from "@huginn/shared";

import { z } from "zod";
import { prisma } from "#database";
import { omitChannelRecipient, selectChannelRecipients } from "#database/common";

import { dispatchToTopic } from "#utils/gateway-utils";
import { useVerifiedJwt } from "#utils/route-utils";

const paramsSchema = z.object({ channelId: z.string() });

export default defineEventHandler(async (event) => {
	const { payload } = await useVerifiedJwt(event);
	const { channelId } = await useValidatedParams(event, paramsSchema);

	const channel = idFix(await prisma.channel.getById(channelId, { select: merge(selectChannelRecipients, omitChannelRecipient(payload.id)) }));

	for (const recipient of channel.recipients) {
		dispatchToTopic(recipient.id, "typying_start", { channelId, userId: payload.id, timestamp: Date.now() });
	}

	return sendNoContent(event, HttpCode.NO_CONTENT);
});
