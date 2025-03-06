import {
	createErrorFactory,
	createHuginnError,
	createRoute,
	getImageData,
	getVideoData,
	invalidFormBody,
	missingAccess,
	waitUntil,
} from "@huginn/backend-shared";
import {
	type APIMessage,
	CDNRoutes,
	Errors,
	HttpCode,
	MessageType,
	WorkerID,
	idFix,
	isImageMediaType,
	isVideoMediaType,
	nullToUndefined,
	snowflake,
} from "@huginn/shared";
import { safeDestr } from "destr";
import { join } from "pathe";
import { z } from "zod";
import { prisma } from "#database";
import { selectMessageDefaults } from "#database/common";
import { envs } from "#setup";
import { dispatchToTopic } from "#utils/gateway-utils";
import { extractData, extractEmbedTags, extractLinks, getAttachmentUrl, verifyJwt } from "#utils/route-utils";
import { cdnUpload } from "#utils/server-request";
import type { DBAttachment, DBEmbed } from "#utils/types";
import { validateEmbeds } from "#utils/validation";

const jsonSchema = z.object({
	content: z.optional(z.string()),
	attachments: z.optional(z.array(z.object({ id: z.number(), description: z.optional(z.string()), filename: z.string() }))),
	embeds: z.optional(
		z.array(
			z.object({
				type: z.enum(["rich", "image", "video"]),
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

const formSchema = z.object({
	payload_json: z.string().nonempty(),
	files: z.record(z.string(), z.instanceof(File)),
});

createRoute("POST", "/api/channels/:channelId/messages", verifyJwt(), async (c) => {
	let body: z.infer<typeof jsonSchema>;
	let files: Record<string, File> = {};
	const contentType = c.req.header("Content-Type");

	if (contentType?.includes("application/json")) {
		const result = jsonSchema.safeParse(await c.req.json());

		if (!result.success) {
			return invalidFormBody(c);
		}

		body = result.data;
	} else if (contentType?.includes("multipart/form-data")) {
		const formData = await c.req.parseBody();
		const formFiles: Record<string, File> = {};
		for (const key of Object.keys(formData)) {
			if (key.startsWith("files[")) {
				formFiles[key] = formData[key] as File;
			}
		}

		const formResult = formSchema.safeParse({ ...formData, files: formFiles });
		const jsonResult = jsonSchema.safeParse(safeDestr(formData.payload_json as string));

		if (!formResult.success || !jsonResult.success) {
			return invalidFormBody(c);
		}

		body = jsonResult.data;
		files = formResult.data.files;
	} else {
		return invalidFormBody(c);
	}

	const payload = c.get("tokenPayload");
	const { channelId } = c.req.param();

	// Check permission
	const channel = idFix(await prisma.channel.getById(channelId, { select: { id: true } }));
	if (!(await prisma.user.hasChannel(payload.id, channel.id))) {
		return missingAccess(c);
	}

	// Body must have either content, attachment or embeds
	if (!body.content && !body.attachments && !body.embeds) {
		return invalidFormBody(c);
	}

	// Validate embeds
	const formError = createErrorFactory(Errors.invalidFormBody());
	if (body.embeds && !validateEmbeds(body.embeds, formError)) {
		return createHuginnError(c, formError);
	}

	// Validate attachments
	if (body.attachments) {
		for (const [i, attachment] of body.attachments.entries()) {
			if (!(`files[${attachment.id}]` in files) || files[`files[${i}]`].name !== attachment.filename) return invalidFormBody(c);
		}
	}

	const messageId = snowflake.generate(WorkerID.MESSAGE);

	const processedAttachments: DBAttachment[] = [];
	if (body.attachments) {
		for (const attachment of body.attachments) {
			const file = files[`files[${attachment.id}]`];
			const fileArrayBuffer = await file.arrayBuffer();

			const name = (await cdnUpload(CDNRoutes.uploadAttachment(channelId, messageId.toString()), {
				files: [{ data: fileArrayBuffer, name: file.name, contentType: file.type }],
			})) as string;

			let dimensions: { width: number; height: number } | undefined;
			if (isImageMediaType(file.type)) {
				dimensions = await getImageData(fileArrayBuffer);
			}
			if (isVideoMediaType(file.type)) {
				dimensions = await getVideoData(join(envs.FFMPEG_TEMP_DIR, file.name), fileArrayBuffer);
			}

			processedAttachments.push({
				contentType: file.type,
				description: attachment.description,
				size: file.size,
				filename: file.name,
				flags: 0,
				width: dimensions?.width,
				height: dimensions?.height,
				url: `attachments/${channelId}/${messageId}/${name}`,
			});
		}
	}

	// Fetch image data from embeds
	const processedEmbeds: DBEmbed[] = [];
	if (body.embeds) {
		for (const embed of body.embeds) {
			let thumbnailData: { width: number; height: number } | undefined;
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
							url: embed.thumbnail?.url ?? "",
							width: embed.thumbnail?.width ?? thumbnailData.width ?? 0,
							height: embed.thumbnail?.height ?? thumbnailData.height ?? 0,
						}
					: undefined,
			});
		}
	}

	const dbMessage = idFix(
		await prisma.message.createMessage(
			messageId,
			payload.id,
			channelId,
			MessageType.DEFAULT,
			body.content,
			processedAttachments,
			processedEmbeds.length === 0 ? undefined : processedEmbeds,
			undefined,
			body.flags,
			{ select: selectMessageDefaults },
		),
	);

	// dbMessage.attachments[0].

	const message: APIMessage = {
		...dbMessage,
		embeds: nullToUndefined(dbMessage.embeds),
		attachments: nullToUndefined(dbMessage.attachments.map((x) => ({ ...x, url: getAttachmentUrl(x.url) }))),
	};
	message.nonce = body.nonce;

	dispatchToTopic(channelId, "message_create", message);

	// Embed generation from urls inside the message content
	waitUntil(c, async () => {
		const embeds: DBEmbed[] = [];
		const links = extractLinks(body.content);
		for (const link of links) {
			const { contentType, response } = await extractData(link);

			if (contentType && isImageMediaType(contentType)) {
				const thumbnailData = await getImageData(await response.arrayBuffer());
				embeds.push({
					type: "image",
					url: response.url,
					thumbnail: { width: thumbnailData?.width ?? 0, height: thumbnailData?.height ?? 0, url: response.url },
				});
				continue;
			}

			if (contentType && isVideoMediaType(contentType)) {
				const videoData = await getVideoData(join(envs.FFMPEG_TEMP_DIR, "output"), await response.arrayBuffer());
				embeds.push({
					type: "video",
					url: response.url,
					video: { width: videoData?.width ?? 0, height: videoData?.height ?? 0, url: response.url },
				});
				continue;
			}

			const metadata = await extractEmbedTags(response);
			const keys = Object.keys(metadata);

			// If we only have a url, don't do anything
			if (metadata.url && keys.length === 1) {
				return;
			}

			if (keys.length > 0) {
				// Fetch image data from embed
				let thumbnailData: { width: number; height: number } | undefined;
				if (metadata.image) {
					thumbnailData = await getImageData(metadata.image);
				}

				embeds.push({
					type: "rich",
					title: metadata.title,
					url: metadata.url,
					description: metadata.description,
					thumbnail: thumbnailData ? { url: metadata.image, width: thumbnailData.width ?? 0, height: thumbnailData.height ?? 0 } : undefined,
				});
			}
		}

		if (!embeds.length) {
			return;
		}

		const updatedMessage = idFix(await prisma.message.updateMessage(dbMessage.id, undefined, embeds, { select: selectMessageDefaults }));

		dispatchToTopic(channelId, "message_update", {
			...updatedMessage,
			embeds: nullToUndefined(updatedMessage.embeds),
			attachments: nullToUndefined(updatedMessage.attachments.map((x) => ({ ...x, url: getAttachmentUrl(x.url) }))),
		});
	});

	return c.json(message, HttpCode.CREATED);
});
