import { invalidFormBody, missingAccess, useValidatedBody, useValidatedParams } from "@huginn/backend-shared";
import { type APIEmbed, type APIMessage, HttpCode, MessageType, idFix, nullToUndefined } from "@huginn/shared";
import { defineEventHandler, setResponseStatus } from "h3";
import { z } from "zod";
import { prisma } from "#database";
import { includeChannelRecipients, includeMessageDefaultFields, omitMessageAuthorId } from "#database/common";
import { router } from "#server";
import { dispatchToTopic } from "#utils/gateway-utils";
import { extractEmbedTags, extractLinks, useVerifiedJwt } from "#utils/route-utils";

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

		const channel = idFix(await prisma.channel.getById(channelId, includeChannelRecipients));
		if (!(await prisma.user.hasChannel(payload.id, channel.id))) {
			return missingAccess(event);
		}

		if (!body.content && !body.attachments) {
			return invalidFormBody(event);
		}

		const embeds: APIEmbed[] = [];
		const links = extractLinks(body.content);
		for (const link of links) {
			const metadata = await extractEmbedTags(link);
			if (Object.keys(metadata).length > 0) {
				embeds.push({
					title: metadata.title,
					url: metadata.url,
					description: metadata.description,
					thumbnail: metadata.image ? { url: metadata.image } : undefined,
				});
			}
		}
		// links

		const dbMessage = idFix(
			await prisma.message.createDefaultMessage(
				payload.id,
				channelId,
				MessageType.DEFAULT,
				body.content,
				body.attachments,
				embeds.length === 0 ? undefined : embeds,
				undefined,
				body.flags,
				includeMessageDefaultFields,
				omitMessageAuthorId,
			),
		);

		const message: APIMessage = { ...dbMessage, embeds: nullToUndefined(dbMessage.embeds) };
		console.log(message);
		message.nonce = body.nonce;

		dispatchToTopic(channelId, "message_create", message);
		// TODO: Don't send notification if message has SUPPRESS_NOTIFICATIONS

		setResponseStatus(event, HttpCode.CREATED);
		return message;
	}),
);
