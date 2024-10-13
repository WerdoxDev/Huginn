import { useValidatedParams } from "@huginn/backend-shared";
import { HttpCode } from "@huginn/shared";
import { defineEventHandler, setResponseHeader, setResponseStatus } from "h3";
import { z } from "zod";
import { router, storage } from "#cdn";
import { extractFileInfo, findImageByName, transformImage } from "#utils/file-utils";

const schema = z.object({ channelId: z.string(), iconHash: z.string() });

router.get(
	"/channel-icons/:channelId/:iconHash",
	defineEventHandler(async (event) => {
		const { iconHash, channelId } = await useValidatedParams(event, schema);
		const { name, format, mimeType } = extractFileInfo(iconHash);

		// Best scenario, file already exists and ready to serve
		const file = await storage.getFile("channel-icons", channelId, `${name}.${format}`);
		// const file = Bun.file(path.resolve(UPLOADS_DIR, `avatars/${name}.${format}`));

		if (file) {
			setResponseStatus(event, HttpCode.OK);
			setResponseHeader(event, "Content-Type", mimeType);
			return file;
		}

		// File doesn't exist so we have to see if another format exists
		const { file: otherFile } = await findImageByName("channel-icons", channelId, name);

		const result = await transformImage(otherFile, format, 100);
		await storage.writeFile("channel-icons", channelId, iconHash, result);

		setResponseStatus(event, HttpCode.OK);
		setResponseHeader(event, "Content-Type", mimeType);
		return new Blob([result]).stream();
	}),
);
