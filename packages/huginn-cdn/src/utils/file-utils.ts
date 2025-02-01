import { CDNError } from "@huginn/backend-shared";
import { CDNErrorType } from "@huginn/backend-shared/types";
import sharp from "sharp";
import { storage } from "#setup";
import { type FileCategory, type FileContentTypes, type FileFormats, type FileInfo, FileTypes } from "./types";

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

	throw new CDNError("findImageByName", CDNErrorType.FILE_NOT_FOUND);
}

export async function transformImage(data: ArrayBuffer, format: FileFormats, quality: number): Promise<ArrayBuffer> {
	if (format === "jpg" || format === "jpeg") {
		return (await sharp(data).jpeg({ quality }).toBuffer()).buffer as ArrayBuffer;
	}
	if (format === "webp") {
		return (await sharp(data).webp({ quality }).toBuffer()).buffer as ArrayBuffer;
	}
	if (format === "png") {
		return (await sharp(data).png({ quality }).toBuffer()).buffer as ArrayBuffer;
	}

	throw new CDNError("transformImage", CDNErrorType.INVALID_FILE_FORMAT);
}
