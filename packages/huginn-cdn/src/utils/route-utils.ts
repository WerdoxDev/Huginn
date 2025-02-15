import { HttpCode } from "@huginn/shared";
import type { Context } from "hono";
import { storage } from "#setup";
import type { FileCategory } from "#utils/types";
import { extractFileInfo, findImageByName, transformImage } from "./file-utils";

export async function tryResolveImage(c: Context, category: FileCategory, subDirectory: string, hash: string) {
	const { name, format, mimeType } = extractFileInfo(hash);

	// Best scenario, file already exists and ready to serve
	const file = await storage.getFile(category, subDirectory, `${name}.${format}`);

	if (file) {
		// c.status(HttpCode.OK);
		// c.header()
		return c.body(file, HttpCode.OK, { "Content-Type": mimeType });
	}

	// File doesn't exist so we have to see if another format exists
	const { file: otherFile } = await findImageByName(category, subDirectory, name);

	// const fileArrayBuffer = await Bun.readableStreamToArrayBuffer(otherFile);
	const result = await transformImage(otherFile, format, 100);
	await storage.writeFile(category, subDirectory, hash, result);

	return c.body(new Blob([result]).stream(), HttpCode.OK, { "Content-Type": mimeType });
}
