import type { HeadBucketCommandOutput, HeadObjectCommandOutput } from "@aws-sdk/client-s3";
import { createRoute, fileNotFound, validator, waitUntil } from "@huginn/backend-shared";
import { HttpCode, type ImageFormats, fileTypes, isImageMediaType, isVideoMediaType } from "@huginn/shared";
import { StreamingApi } from "hono/utils/stream";
import { z } from "zod";
import { cacheStorage, storage } from "#setup";
import { extractFileInfo, transformImage } from "#utils/file-utils";
import { getCacheDir } from "#utils/route-utils";

// const querySchema = z.object({ token: z.string(), expires: z.string() });
const querySchema = z.object({
	format: z.optional(z.string()),
	quality: z.optional(z.string()),
	width: z.optional(z.string()),
	height: z.optional(z.string()),
});

createRoute("GET", "/cdn/attachments/:channelId/:messageId/:filename", validator("query", querySchema), async (c) => {
	const { format, quality, width, height } = c.req.valid("query");
	const { channelId, messageId, filename } = c.req.param();
	const { mimeType, name, extension } = extractFileInfo(filename);

	// Video files with range require gettings a specific range of bytes from the video
	if (isVideoMediaType(mimeType)) {
		const head = (await storage.head("attachments", `${channelId}/${messageId}`, filename)) as HeadObjectCommandOutput;
		if (!head) {
			return fileNotFound(c);
		}

		const range = c.req.header("Range");
		if (range) {
			const parts = range.replace(/bytes=/, "").split("-");
			const start = Number.parseInt(parts[0], 10);
			const end = parts[1] ? Number.parseInt(parts[1], 10) : (head.ContentLength ?? 0) - 1;
			const chunkSize = end - start + 1;

			const file = await storage.getFile("attachments", `${channelId}/${messageId}`, filename, range);

			if (file) {
				return c.body(file, HttpCode.PARTIAL_CONTENT, {
					"Content-Type": mimeType,
					"Content-Range": `bytes ${start}-${end}/${head.ContentLength}`,
					"Accept-Ranges": "bytes",
					"Content-Length": chunkSize.toString(),
				});
			}
		}
	}

	const cacheDir = getCacheDir(format, Number(quality), Number(width), Number(height));

	// We don't cache an image without any modifiers
	if ((format || quality || width || height) && isImageMediaType(mimeType)) {
		const cachedFile = await cacheStorage.getFile("attachments", `${channelId}/${messageId}/${cacheDir}`, filename);

		if (cachedFile) {
			console.log("hit cache");
			return c.body(cachedFile, HttpCode.OK, { "Content-Type": mimeType });
		}
	}

	const file = await storage.getFile("attachments", `${channelId}/${messageId}`, filename);

	if (!file) {
		return fileNotFound(c);
	}

	if ((format || quality || width || height) && isImageMediaType(mimeType)) {
		const { readable, writable } = new TransformStream();
		const stream = new StreamingApi(writable, readable);

		const result = await transformImage(
			file as ReadableStream,
			stream,
			Object.entries(fileTypes).find((x) => x[1] === mimeType)?.[0] as ImageFormats,
			Number(quality),
			Number(width),
			Number(height),
		);
		const [readable1, readable2] = stream.responseReadable.tee();

		// Write the image in cache
		waitUntil(c, async () => {
			if (result) {
				await cacheStorage.writeFile(
					"attachments",
					`${channelId}/${messageId}/${cacheDir}`,
					filename,
					await Bun.readableStreamToArrayBuffer(readable2),
				);
			}
		});

		return c.body(readable1, HttpCode.OK, { "Content-Type": format ? fileTypes[format as ImageFormats] : mimeType });
	}

	return c.body(file, HttpCode.OK, { "Content-Type": mimeType });
});
