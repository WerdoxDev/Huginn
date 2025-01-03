import { createErrorFactory, createHuginnError, invalidFormBody, missingAccess, useValidatedBody, useValidatedParams } from "@huginn/backend-shared";
import { type APIEmbed, type APIMessage, Errors, HttpCode, MessageType, idFix, nullToUndefined } from "@huginn/shared";
import { defineEventHandler, setResponseStatus } from "h3";
import probe, { type ProbeResult } from "probe-image-size";
import { z } from "zod";
import { prisma } from "#database";
import { includeChannelRecipients, includeMessageDefaultFields, omitMessageAuthorId } from "#database/common";
import { router } from "#server";
import { dispatchToTopic } from "#utils/gateway-utils";
import { extractEmbedTags, extractLinks, useVerifiedJwt } from "#utils/route-utils";
import type { DBEmbed } from "#utils/types";
import { validateEmbeds } from "#utils/validation";

const bodySchema = z.object({
	content: z.optional(z.string()),
	attachments: z.optional(z.array(z.string())),
	embeds: z.optional(
		z.array(
			z.object({
				type: z.optional(z.string()),
				title: z.optional(z.string()),
				url: z.optional(z.string()),
				description: z.optional(z.string()),
				timestamp: z.optional(z.string()),
				thumbnail: z.optional(z.object({ url: z.string(), width: z.optional(z.number()), height: z.optional(z.number()) })),
			}),
		),
	),
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

		if (!body.content && !body.attachments && !body.embeds) {
			return invalidFormBody(event);
		}

		const formError = createErrorFactory(Errors.invalidFormBody());
		if (body.embeds && !validateEmbeds(body.embeds, formError)) {
			return createHuginnError(event, formError);
		}

		// Fetch image data from embeds
		const transformedEmbeds: DBEmbed[] = [];
		if (body.embeds) {
			for (const embed of body.embeds) {
				let thumbnailData: ProbeResult | undefined;
				if (embed.thumbnail) {
					thumbnailData = await probe(embed.thumbnail.url);
				}

				transformedEmbeds.push({
					title: embed.title,
					url: embed.url,
					description: embed.description,
					timestamp: embed.timestamp,
					type: embed.type,
					thumbnail: thumbnailData ? { url: thumbnailData.url, width: thumbnailData.width, height: thumbnailData.height } : undefined,
				});
			}
		}

		// Embed generation
		const embeds: DBEmbed[] = [];
		const links = extractLinks(body.content);
		for (const link of links) {
			const metadata = await extractEmbedTags(link);
			if (Object.keys(metadata).length > 0) {
				// Fetch image data from embed
				let thumbnailData: ProbeResult | undefined;
				if (metadata.image) {
					thumbnailData = await probe(metadata.image);
				}

				embeds.push({
					title: metadata.title,
					url: metadata.url,
					description: metadata.description,
					thumbnail: thumbnailData ? { url: thumbnailData.url, width: thumbnailData.width, height: thumbnailData.height } : undefined,
				});
			}
		}

		const finalEmbeds: DBEmbed[] = [...embeds, ...(transformedEmbeds || [])];

		const dbMessage = idFix(
			await prisma.message.createDefaultMessage(
				payload.id,
				channelId,
				MessageType.DEFAULT,
				body.content,
				body.attachments,
				finalEmbeds.length === 0 ? undefined : finalEmbeds,
				undefined,
				body.flags,
				includeMessageDefaultFields,
				omitMessageAuthorId,
			),
		);

		const message: APIMessage = { ...dbMessage, embeds: nullToUndefined(dbMessage.embeds) };
		message.nonce = body.nonce;

		dispatchToTopic(channelId, "message_create", message);
		// TODO: Don't send notification if message has SUPPRESS_NOTIFICATIONS

		event.waitUntil(async () => {
			await new Promise((resolve) => setTimeout(resolve, 1000));
			dispatchToTopic(channelId, "message_create", message);
		});

		setResponseStatus(event, HttpCode.CREATED);
		return message;
	}),
);
