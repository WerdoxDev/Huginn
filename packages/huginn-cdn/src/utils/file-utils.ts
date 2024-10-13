import { createError } from "h3";
import sharp from "sharp";
import { storage } from "#cdn";
import { CDNError, CDNErrorType } from "../error";
import { type FileCategory, type FileContentTypes, type FileFormats, type FileInfo, FileTypes } from "../types";

export function extractFileInfo(filename: string): FileInfo {
	const split = filename.split(".");
	const name = split[0];

	if (!Object.keys(FileTypes).some((x) => x === split[1])) {
		return { name, format: split[1], mimeType: "application/octet-stream" };
	}

	const format = split[1] as keyof typeof FileTypes;
	const mimeType = FileTypes[format] as FileContentTypes;

	return { name, format, mimeType };
}

export async function findImageByName(category: FileCategory, subDirectory: string, name: string) {
	const formats = ["png", "jpeg", "jpg", "webp"];

	for (const format of formats) {
		const filename = `${name}.${format}`;

		const exists = await storage.exists(category, subDirectory, filename);

		if (exists) {
			return { file: (await storage.getFile(category, subDirectory, filename)) as ReadableStream, info: extractFileInfo(filename) };
		}
	}

	throw createError({ cause: new CDNError("findImageByName", CDNErrorType.FILE_NOT_FOUND) });
}

export async function transformImage(stream: ReadableStream, format: FileFormats, quality: number): Promise<ArrayBuffer> {
	if (format === "jpg" || format === "jpeg") {
		return (
			await sharp(await Bun.readableStreamToArrayBuffer(stream))
				.jpeg({ quality })
				.toBuffer()
		).buffer as ArrayBuffer;
	}
	if (format === "webp") {
		return (
			await sharp(await Bun.readableStreamToArrayBuffer(stream))
				.webp({ quality })
				.toBuffer()
		).buffer as ArrayBuffer;
	}
	if (format === "png") {
		return (
			await sharp(await Bun.readableStreamToArrayBuffer(stream))
				.png({ quality })
				.toBuffer()
		).buffer as ArrayBuffer;
	}

	throw createError({ cause: new CDNError("transformImage", CDNErrorType.INVALID_FILE_FORMAT) });
}
