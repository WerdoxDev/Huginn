import { useValidatedParams } from "@huginn/backend-shared";
import { HttpCode } from "@huginn/shared";
import { defineEventHandler, setResponseStatus } from "h3";
import { z } from "zod";
import { prisma } from "#database";
import { gateway, router } from "#server";
import { dispatchToTopic } from "#utils/gateway-utils";
import { useVerifiedJwt } from "#utils/route-utils";

const schema = z.object({ userId: z.string() });

router.delete(
	"/users/@me/relationships/:userId",
	defineEventHandler(async (event) => {
		const { payload } = await useVerifiedJwt(event);
		const userId = (await useValidatedParams(event, schema)).userId;

		await prisma.relationship.deleteByUserId(payload.id, userId);

		dispatchToTopic(payload.id, "relationship_remove", userId);
		dispatchToTopic(userId, "relationship_remove", payload.id);

		gateway.presenceManeger.removeFromUser(payload.id, userId);
		gateway.presenceManeger.removeFromUser(userId, payload.id);

		gateway.unsubscribeSessionsFromTopic(payload.id, `${userId}_public`);
		gateway.unsubscribeSessionsFromTopic(userId, `${payload.id}_public`);
		gateway.unsubscribeSessionsFromTopic(payload.id, `${userId}_presence`);
		gateway.unsubscribeSessionsFromTopic(userId, `${payload.id}_presence`);

		setResponseStatus(event, HttpCode.OK);
		return null;
	}),
);
