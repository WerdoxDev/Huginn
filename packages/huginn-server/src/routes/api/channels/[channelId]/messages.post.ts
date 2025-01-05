import { createErrorFactory, createHuginnError, invalidFormBody, missingAccess, useValidatedBody, useValidatedParams } from "@huginn/backend-shared";
import { type APIMessage, Errors, HttpCode, MessageType, idFix, nullToUndefined } from "@huginn/shared";
import { defineEventHandler, setResponseStatus } from "h3";
import type { ProbeResult } from "probe-image-size";
import { z } from "zod";
import { prisma } from "#database";
import { omitMessageAuthorId, selectMessageDefaults } from "#database/common";
import { router } from "#server";
import { dispatchToTopic } from "#utils/gateway-utils";
import { extractEmbedTags, extractLinks, getImageData, useVerifiedJwt } from "#utils/route-utils";
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

		const channel = idFix(await prisma.channel.getById(channelId, { select: { id: true } }));
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
		const processedEmbeds: DBEmbed[] = [];
		if (body.embeds) {
			for (const embed of body.embeds) {
				let thumbnailData: ProbeResult | undefined;
				if (embed.thumbnail && (!embed.thumbnail.width || !embed.thumbnail.height)) {
					thumbnailData = await getImageData(embed.thumbnail.url);
				}

				processedEmbeds.push({
					title: embed.title,
					url: embed.url,
					description: embed.description,
					timestamp: embed.timestamp,
					type: embed.type,
					thumbnail: thumbnailData
						? {
								url: thumbnailData.url,
								width: embed.thumbnail?.width ?? thumbnailData.width,
								height: embed.thumbnail?.height ?? thumbnailData.height,
							}
						: undefined,
				});
			}
		}

		const dbMessage = idFix(
			await prisma.message.createMessage(
				payload.id,
				channelId,
				MessageType.DEFAULT,
				body.content,
				body.attachments,
				processedEmbeds.length === 0 ? undefined : processedEmbeds,
				undefined,
				body.flags,
				{ select: selectMessageDefaults },
			),
		);

		const message: APIMessage = { ...dbMessage, embeds: nullToUndefined(dbMessage.embeds) };
		message.nonce = body.nonce;

		// TODO: Don't send notification if message has SUPPRESS_NOTIFICATIONS
		dispatchToTopic(channelId, "message_create", message);

		// Embed generation from urls inside the message content
		event.waitUntil(async () => {
			const embeds: DBEmbed[] = [];
			const links = extractLinks(body.content);
			for (const link of links) {
				const metadata = await extractEmbedTags(link);
				if (Object.keys(metadata).length > 0) {
					// Fetch image data from embed
					let thumbnailData: ProbeResult | undefined;
					if (metadata.image) {
						thumbnailData = await getImageData(metadata.image);
					}

					embeds.push({
						title: metadata.title,
						url: metadata.url,
						description: metadata.description,
						thumbnail: thumbnailData ? { url: thumbnailData.url, width: thumbnailData.width, height: thumbnailData.height } : undefined,
					});
				}
			}

			const updatedMessage = idFix(await prisma.message.updateMessage(dbMessage.id, undefined, embeds, { select: selectMessageDefaults }));

			dispatchToTopic(channelId, "message_update", { ...updatedMessage, embeds: nullToUndefined(updatedMessage.embeds) });
		});

		setResponseStatus(event, HttpCode.CREATED);
		return message;
	}),
);
