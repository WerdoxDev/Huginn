import { useValidatedParams } from "@huginn/backend-shared";
import { HttpCode } from "@huginn/shared";
import { defineEventHandler, setResponseHeader, setResponseStatus } from "h3";
import { z } from "zod";
import { router, storage } from "#cdn";
import { extractFileInfo, findImageByName, transformImage } from "#utils/file-utils";

const schema = z.object({ userId: z.string(), avatarHash: z.string() });

router.get(
	"/avatars/:userId/:avatarHash",
	defineEventHandler(async (event) => {
		const { avatarHash, userId } = await useValidatedParams(event, schema);
		const { name, format, mimeType } = extractFileInfo(avatarHash);

		// Best scenario, file already exists and ready to serve
		const file = await storage.getFile("avatars", userId, `${name}.${format}`);
		// const file = Bun.file(path.resolve(UPLOADS_DIR, `avatars/${name}.${format}`));

		if (file) {
			setResponseStatus(event, HttpCode.OK);
			setResponseHeader(event, "Content-Type", mimeType);
			return file;
		}

		// File doesn't exist so we have to see if another format exists
		const { file: otherFile } = await findImageByName("avatars", userId, name);

		const result = await transformImage(otherFile, format, 100);
		await storage.writeFile("avatars", userId, avatarHash, result);

		setResponseStatus(event, HttpCode.OK);
		setResponseHeader(event, "Content-Type", mimeType);
		return new Blob([result]).stream();
	}),
);
