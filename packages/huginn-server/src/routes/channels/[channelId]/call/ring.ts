import { createErrorFactory, createHuginnError, createRoute, missingAccess, validator } from "@huginn/backend-shared";
import { prisma } from "@huginn/backend-shared/database/index";
import { Errors, HttpCode, MessageType, idFix } from "@huginn/shared";
import { z } from "zod";
import { gateway } from "#setup";
import { dispatchMessage } from "#utils/helpers";
import { verifyJwt } from "#utils/route-utils";

const schema = z.object({ recipients: z.nullable(z.array(z.string())) });

createRoute("POST", "/api/channels/:channelId/call/ring", verifyJwt(), validator("json", schema), async (c) => {
	const payload = c.get("tokenPayload");
	const { channelId } = c.req.param();
	const body = c.req.valid("json");

	const channel = idFix(
		await prisma.channel.getById(channelId, { select: { recipients: { where: { id: { not: BigInt(payload.id) } }, select: { id: true } } } }),
	);

	if (!(await prisma.user.hasChannel(payload.id, channelId))) {
		return missingAccess(c);
	}

	if (body.recipients && !body.recipients?.every((x) => channel.recipients.some((y) => y.id === x))) {
		return createHuginnError(c, createErrorFactory(Errors.unknownUser(body.recipients)));
	}

	const message = await dispatchMessage(payload.id, channelId, MessageType.CALL, undefined, undefined, undefined, [payload.id]);
	gateway.voiceManager.addCall(
		channelId,
		message.id,
		channel.recipients.map((x) => x.id),
	);

	return c.newResponse(null, HttpCode.NO_CONTENT);
});
