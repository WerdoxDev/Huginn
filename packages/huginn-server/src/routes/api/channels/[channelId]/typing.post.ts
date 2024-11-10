import { useValidatedParams } from "@huginn/backend-shared";
import { HttpCode, idFix, merge } from "@huginn/shared";
import { defineEventHandler, sendNoContent } from "h3";
import { z } from "zod";
import { prisma } from "#database";
import { excludeChannelRecipient, includeChannelRecipients } from "#database/common";
import { router } from "#server";
import { dispatchToTopic } from "#utils/gateway-utils";
import { useVerifiedJwt } from "#utils/route-utils";

const paramsSchema = z.object({ channelId: z.string() });

router.post(
	"/channels/:channelId/typing",
	defineEventHandler(async (event) => {
		const { payload } = await useVerifiedJwt(event);
		const { channelId } = await useValidatedParams(event, paramsSchema);

		const channel = idFix(await prisma.channel.getById(channelId, merge(includeChannelRecipients, excludeChannelRecipient(payload.id))));

		for (const recipient of channel.recipients) {
			dispatchToTopic(recipient.id, "typying_start", { channelId, userId: payload.id, timestamp: Date.now() });
		}

		return sendNoContent(event, HttpCode.NO_CONTENT);
	}),
);
