import { createRoute, fileNotFound, validator } from "@huginn/backend-shared";
import { HttpCode } from "@huginn/shared";
import { z } from "zod";
import { storage } from "#setup";
import { extractFileInfo } from "#utils/file-utils";

const querySchema = z.object({ token: z.string(), expires: z.string() });

createRoute("GET", "/cdn/attachments/:channelId/:messageId/:filename", async (c) => {
	// const { expires, token } = c.req.valid("query");
	const { channelId, messageId, filename } = c.req.param();
	const { mimeType } = extractFileInfo(filename);

	const file = await storage.getFile("attachments", `${channelId}/${messageId}`, filename);

	if (file) {
		return c.body(file, HttpCode.OK, { "Content-Type": mimeType });
	}

	return fileNotFound(c);
});
