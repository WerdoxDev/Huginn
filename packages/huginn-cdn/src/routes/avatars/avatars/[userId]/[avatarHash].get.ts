import path from "node:path";
import { useValidatedParams } from "@huginn/backend-shared";
import { HttpCode } from "@huginn/shared";
import { defineEventHandler, setResponseHeader, setResponseStatus } from "h3";
import { z } from "zod";
import { router } from "#cdn";
import { uploadsDir } from "#setup";
import { extractFileInfo, findImageByName, transformImage } from "#utils/file-utils";

const schema = z.object({ avatarHash: z.string() });

router.get(
	"/avatars/:userId/:avatarHash",
	defineEventHandler(async (event) => {
		const avatashHash = (await useValidatedParams(event, schema)).avatarHash;
		const { name, format, mimeType } = extractFileInfo(avatashHash);

		// Best scenario, file already exists and ready to serve
		const file = Bun.file(path.resolve(uploadsDir, `avatars/${name}.${format}`));

		if (await file.exists()) {
			setResponseStatus(event, HttpCode.OK);
			setResponseHeader(event, "Content-Type", mimeType);
			return file.stream();
		}

		// File doesn't exist so we have to see if another format exists
		const { file: otherFile } = await findImageByName("avatars", name);

		const result = await transformImage(otherFile, format, 100);
		await Bun.write(path.resolve(uploadsDir, `avatars/${avatashHash}`), result);

		setResponseStatus(event, HttpCode.OK);
		setResponseHeader(event, "Content-Type", mimeType);
		return new Blob([result]).stream();
	}),
);
