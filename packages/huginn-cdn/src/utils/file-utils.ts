import { CDNError } from "@huginn/backend-shared";
import { CDNErrorType } from "@huginn/backend-shared/types";
import { type FileContentTypes, type FileFormats, fileTypes } from "@huginn/shared";
import PQueue from "p-queue";
import sharp from "sharp";
import { storage } from "#setup";
import type { FileCategory, FileInfo } from "./types";

const queue = new PQueue({ concurrency: 1 });

export function extractFileInfo(filename: string): FileInfo {
	const extensionStartIndex = filename.lastIndexOf(".");
	const extension = filename.slice(extensionStartIndex + 1);
	const name = filename.slice(0, extensionStartIndex);

	if (!Object.keys(fileTypes).some((x) => x === extension.toLowerCase())) {
		return { name, format: extension, extension, mimeType: "application/octet-stream" };
	}

	const format = extension.toLowerCase() as keyof typeof fileTypes;
	const mimeType = fileTypes[format] as FileContentTypes;

	return { name, format, extension, mimeType };
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
	sharp.concurrency(2);

	let buffer: Buffer<ArrayBufferLike> | undefined;
	if (format === "jpg" || format === "jpeg") {
		buffer = (await queue.add(() => sharp(data).jpeg({ quality }).toBuffer())) as Buffer<ArrayBufferLike>;
	}
	if (format === "webp") {
		buffer = (await queue.add(() => sharp(data).webp({ quality }).toBuffer())) as Buffer<ArrayBufferLike>;
	}
	if (format === "png") {
		buffer = (await queue.add(() => sharp(data).png({ quality }).toBuffer())) as Buffer<ArrayBufferLike>;
	}
	if (format === "gif") {
		buffer = (await queue.add(() => sharp(data).gif().toBuffer())) as Buffer<ArrayBufferLike>;
	}

	if (buffer) {
		return buffer.buffer as ArrayBuffer;
	}

	throw new CDNError("transformImage", CDNErrorType.INVALID_FILE_FORMAT);
}
