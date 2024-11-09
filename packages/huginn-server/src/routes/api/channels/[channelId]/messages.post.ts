import { invalidFormBody, useValidatedBody, useValidatedParams } from "@huginn/backend-shared";
import { type APIMessage, HttpCode, MessageType, idFix, omit } from "@huginn/shared";
import { defineEventHandler, setResponseStatus } from "h3";
import { z } from "zod";
import { prisma } from "#database";
import { includeMessageAuthorAndMentions, omitMessageAuthorId } from "#database/common";
import { router } from "#server";
import { dispatchToTopic } from "#utils/gateway-utils";
import { useVerifiedJwt } from "#utils/route-utils";

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
		const { channelId } = await useValidatedParams(event, paramsSchema);

		if (!body.content && !body.attachments) {
			return invalidFormBody(event);
		}

		const message: APIMessage = idFix(
			await prisma.message.createDefaultMessage(
				payload.id,
				channelId,
				MessageType.DEFAULT,
				body.content,
				body.attachments,
				undefined,
				body.flags,
				includeMessageAuthorAndMentions,
				omitMessageAuthorId,
			),
		);

		message.nonce = body.nonce;

		dispatchToTopic(channelId, "message_create", message);
		// TODO: Don't send notification if message has SUPPRESS_NOTIFICATIONS

		setResponseStatus(event, HttpCode.CREATED);
		return message;
	}),
);
