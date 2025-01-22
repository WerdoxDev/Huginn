import { useValidatedParams } from "@huginn/backend-shared";
import { HttpCode, idFix } from "@huginn/shared";

import { z } from "zod";
import { prisma } from "#database";

import { dispatchToTopic } from "#utils/gateway-utils";
import { useVerifiedJwt } from "#utils/route-utils";

const schema = z.object({ channelId: z.string(), messageId: z.string() });

export default defineEventHandler(async (event) => {
	const { payload } = await useVerifiedJwt(event);
	const { channelId, messageId } = await useValidatedParams(event, schema);

	await prisma.readState.updateLastRead(payload.id, channelId, messageId);
	dispatchToTopic(payload.id, "message_ack", { channelId, messageId });

	return sendNoContent(event, HttpCode.OK);
});
