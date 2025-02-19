import { createRoute, fileNotFound, validator } from "@huginn/backend-shared";
import { HttpCode, fileTypes } from "@huginn/shared";
import { z } from "zod";
import { storage } from "#setup";
import { extractFileInfo, transformImage } from "#utils/file-utils";

// const querySchema = z.object({ token: z.string(), expires: z.string() });
const querySchema = z.object({ quality: z.optional(z.string()) });

createRoute("GET", "/cdn/attachments/:channelId/:messageId/:filename", validator("query", querySchema), async (c) => {
	const { quality } = c.req.valid("query");
	const { channelId, messageId, filename } = c.req.param();
	const { mimeType } = extractFileInfo(filename);

	const file = await storage.getFile("attachments", `${channelId}/${messageId}`, filename);

	if (!file) {
		return fileNotFound(c);
	}

	const transformed = quality
		? await transformImage(file, Object.entries(fileTypes).find((x) => x[1] === mimeType)?.[0] ?? "png", Number(quality))
		: file;

	return c.body(transformed, HttpCode.OK, { "Content-Type": mimeType });
});
