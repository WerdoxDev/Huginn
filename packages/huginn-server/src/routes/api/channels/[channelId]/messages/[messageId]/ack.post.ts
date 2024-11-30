import { useValidatedParams } from "@huginn/backend-shared";
import { HttpCode, idFix } from "@huginn/shared";
import { defineEventHandler, sendNoContent } from "h3";
import { z } from "zod";
import { prisma } from "#database";
import { router } from "#server";
import { useVerifiedJwt } from "#utils/route-utils";

const schema = z.object({ channelId: z.string(), messageId: z.string() });

router.post(
	"/channels/:channelId/messages/:messageId/ack",
	defineEventHandler(async (event) => {
		const { payload } = await useVerifiedJwt(event);
		const { channelId, messageId } = await useValidatedParams(event, schema);

		const message = idFix(await prisma.message.getById(channelId, messageId));
		await prisma.readState.updateLastReadMessage(payload.id, channelId, message.id);

		return sendNoContent(event, HttpCode.OK);
	}),
);
