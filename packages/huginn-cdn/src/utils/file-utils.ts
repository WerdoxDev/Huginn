import path from "node:path";
import type { BunFile } from "bun";
import { createError } from "h3";
import sharp from "sharp";
import { CDNError, CDNErrorType } from "../error";
import { uploadsDir } from "../setup";
import { type FileContentTypes, type FileFormats, type FileInfo, FileTypes } from "../types";

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

export async function findImageByName(directory: string, name: string) {
	const formats = ["png", "jpeg", "jpg", "webp"];

	for (const format of formats) {
		const filename = `${name}.${format}`;
		const file = Bun.file(path.resolve(uploadsDir, directory, filename));
		if (await file.exists()) {
			return { file, info: extractFileInfo(filename) };
		}
	}

	throw createError({ cause: new CDNError("findImageByName", CDNErrorType.FILE_NOT_FOUND) });
}

export async function transformImage(file: BunFile, format: FileFormats, quality: number) {
	if (format === "jpg" || format === "jpeg") {
		return (
			await sharp(await file.arrayBuffer())
				.jpeg({ quality })
				.toBuffer()
		).buffer as ArrayBuffer;
	}
	if (format === "webp") {
		return (
			await sharp(await file.arrayBuffer())
				.webp({ quality })
				.toBuffer()
		).buffer as ArrayBuffer;
	}
	if (format === "png") {
		return (
			await sharp(await file.arrayBuffer())
				.png({ quality })
				.toBuffer()
		).buffer as ArrayBuffer;
	}

	throw createError({ cause: new CDNError("transformImage", CDNErrorType.INVALID_FILE_FORMAT) });
}
