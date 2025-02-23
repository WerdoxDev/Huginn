import { createRoute, fileNotFound, validator, waitUntil } from "@huginn/backend-shared";
import { HttpCode, fileTypes, isImageMediaType } from "@huginn/shared";
import { StreamingApi } from "hono/utils/stream";
import { z } from "zod";
import { storage } from "#setup";
import { extractFileInfo, transformImage } from "#utils/file-utils";

// const querySchema = z.object({ token: z.string(), expires: z.string() });
const querySchema = z.object({ quality: z.optional(z.string()) });

createRoute("GET", "/cdn/attachments/:channelId/:messageId/:filename", validator("query", querySchema), async (c) => {
	const { quality } = c.req.valid("query");
	const { channelId, messageId, filename } = c.req.param();
	const { mimeType, format, name, extension } = extractFileInfo(filename);

	const actualFileName = `${name}${quality !== undefined && quality !== "lossless" && quality !== "100" ? `_q${quality}` : ""}.${extension}`;
	let file = await storage.getFile("attachments", `${channelId}/${messageId}`, actualFileName);

	if (quality !== "lossless" && quality !== "100" && isImageMediaType(mimeType) && !file) {
		if (!file) {
			file = await storage.getFile("attachments", `${channelId}/${messageId}`, filename);
		}

		if (!file) {
			return fileNotFound(c);
		}

		const { readable, writable } = new TransformStream();
		const stream = new StreamingApi(writable, readable);

		const result = await transformImage(
			file as ReadableStream,
			stream,
			Object.entries(fileTypes).find((x) => x[1] === mimeType)?.[0] ?? "png",
			Number(quality),
		);
		const [readable1, readable2] = stream.responseReadable.tee();

		waitUntil(c, async () => {
			if (result) {
				await storage.writeFile("attachments", `${channelId}/${messageId}`, actualFileName, await Bun.readableStreamToArrayBuffer(readable2));
			}
		});

		return c.body(readable1, HttpCode.OK, { "Content-Type": mimeType });
	}

	if (!file) {
		return fileNotFound(c);
	}

	return c.body(file, HttpCode.OK, { "Content-Type": mimeType });
});
