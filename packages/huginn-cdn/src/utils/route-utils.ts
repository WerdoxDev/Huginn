import { waitUntil } from "@huginn/backend-shared";
import { HttpCode, type ImageFormats } from "@huginn/shared";
import type { Context } from "hono";
import { StreamingApi } from "hono/utils/stream";
import { storage } from "#setup";
import type { FileCategory } from "#utils/types";
import { extractFileInfo, findImageByName, transformImage } from "./file-utils";

export async function tryResolveImage(c: Context, category: FileCategory, subDirectory: string, hash: string) {
	const { name, format, mimeType } = extractFileInfo(hash);

	// Best scenario, file already exists and ready to serve
	const file = await storage.getFile(category, subDirectory, `${name}.${format}`);

	if (file) {
		return c.body(file, HttpCode.OK, { "Content-Type": mimeType });
	}

	// File doesn't exist so we have to see if another format exists
	const { file: otherFile } = await findImageByName(category, subDirectory, name);

	const { readable, writable } = new TransformStream();
	const stream = new StreamingApi(writable, readable);

	const result = await transformImage(otherFile, stream, format as ImageFormats);
	const [readable1, readable2] = stream.responseReadable.tee();

	waitUntil(c, async () => {
		if (result) {
			await storage.writeFile(category, subDirectory, hash, readable2);
		}
	});

	return c.body(readable1, HttpCode.OK, { "Content-Type": mimeType });
}

export function getCacheDir(format?: string, quality?: number, width?: number, height?: number) {
	const modifiers = [];

	if (format) {
		modifiers.push(`format_${format}`);
	}
	if (quality && !Number.isNaN(quality)) {
		modifiers.push(`quality_${quality}`);
	}
	if (width && !Number.isNaN(width)) {
		modifiers.push(`width_${width}`);
	}
	if (height && !Number.isNaN(height)) {
		modifiers.push(`height_${height}`);
	}

	return modifiers.join(",");
}
