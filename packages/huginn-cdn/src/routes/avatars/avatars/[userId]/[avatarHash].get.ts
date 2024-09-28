import path from "node:path";
import { useValidatedParams } from "@huginn/backend-shared";
import { HttpCode } from "@huginn/shared";
import { defineEventHandler, setResponseHeader, setResponseStatus } from "h3";
import { z } from "zod";
import { router, storage } from "#cdn";
import { UPLOADS_DIR } from "#setup";
import { extractFileInfo, findImageByName, transformImage } from "#utils/file-utils";

const schema = z.object({ avatarHash: z.string() });

router.get(
	"/avatars/:userId/:avatarHash",
	defineEventHandler(async (event) => {
		const avatashHash = (await useValidatedParams(event, schema)).avatarHash;
		const { name, format, mimeType } = extractFileInfo(avatashHash);

		// Best scenario, file already exists and ready to serve
		const file = await storage.getFile("avatars", `${name}.${format}`);
		// const file = Bun.file(path.resolve(UPLOADS_DIR, `avatars/${name}.${format}`));

		if (file) {
			setResponseStatus(event, HttpCode.OK);
			setResponseHeader(event, "Content-Type", mimeType);
			return file;
		}

		// File doesn't exist so we have to see if another format exists
		const { file: otherFile } = await findImageByName("avatars", name);

		const result = await transformImage(otherFile, format, 100);
		await storage.writeFile("avatars", avatashHash, result);

		setResponseStatus(event, HttpCode.OK);
		setResponseHeader(event, "Content-Type", mimeType);
		return new Blob([result]).stream();
	}),
);
