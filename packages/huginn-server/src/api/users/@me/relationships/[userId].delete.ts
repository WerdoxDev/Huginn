import { useValidatedParams } from "@huginn/backend-shared";
import { HttpCode } from "@huginn/shared";

import { z } from "zod";
import { prisma } from "#database";
import { gateway } from "#setup";
import { dispatchToTopic } from "#utils/gateway-utils";
import { useVerifiedJwt } from "#utils/route-utils";

const schema = z.object({ userId: z.string() });

export default defineEventHandler(async (event) => {
	const { payload } = await useVerifiedJwt(event);
	const userId = (await useValidatedParams(event, schema)).userId;

	await prisma.relationship.deleteByUserId(payload.id, userId);

	dispatchToTopic(payload.id, "relationship_remove", userId);
	dispatchToTopic(userId, "relationship_remove", payload.id);

	gateway.presenceManeger.sendToUser(payload.id, userId, true);
	gateway.presenceManeger.sendToUser(userId, payload.id, true);

	gateway.unsubscribeSessionsFromTopic(payload.id, `${userId}_public`);
	gateway.unsubscribeSessionsFromTopic(payload.id, `${userId}_presence`);

	gateway.unsubscribeSessionsFromTopic(userId, `${payload.id}_public`);
	gateway.unsubscribeSessionsFromTopic(userId, `${payload.id}_presence`);

	return sendNoContent(event, HttpCode.NO_CONTENT);
});
