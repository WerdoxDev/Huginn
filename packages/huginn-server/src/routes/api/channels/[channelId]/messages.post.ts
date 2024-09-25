import { router } from "#server";
import { prisma } from "#database";
import { invalidFormBody, useValidatedBody, useValidatedParams } from "@huginn/backend-shared";
import { type APIMessage, HttpCode, idFix, omit } from "@huginn/shared";
import { dispatchToTopic } from "#utils/gateway-utils";
import { useVerifiedJwt } from "#utils/route-utils";
import { defineEventHandler, setResponseStatus } from "h3";
import { z } from "zod";

const bodySchema = z.object({
	content: z.optional(z.string()),
	attachments: z.optional(z.array(z.string())),
	flags: z.optional(z.number()),
	nonce: z.optional(z.union([z.number(), z.string()])),
});

const paramsSchema = z.object({ channelId: z.string() });

router.post(
	"/channels/:channelId/messages",
	defineEventHandler(async (event) => {
		const { payload } = await useVerifiedJwt(event);
		const body = await useValidatedBody(event, bodySchema);
		const channelId = (await useValidatedParams(event, paramsSchema)).channelId;

		if (!body.content && !body.attachments) {
			return invalidFormBody(event);
		}

		const message: APIMessage = omit(
			idFix(
				await prisma.message.createDefaultMessage(payload.id, channelId, body.content, body.attachments, body.flags, {
					author: true,
					mentions: true,
				}),
			),
			["authorId"],
		);

		message.nonce = body.nonce;

		dispatchToTopic(channelId, "message_create", message);
		// TODO: Don't send notification if message has SUPPRESS_NOTIFICATIONS

		setResponseStatus(event, HttpCode.CREATED);
		return message;
	}),
);
