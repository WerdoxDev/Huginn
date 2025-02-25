import { Readable, Writable } from "node:stream";
import { CDNError } from "@huginn/backend-shared";
import { CDNErrorType } from "@huginn/backend-shared/types";
import { type FileContentTypes, type ImageFormats, fileTypes } from "@huginn/shared";
import type { StreamingApi } from "hono/utils/stream";
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

export async function transformImage(
	input: ReadableStream,
	output: StreamingApi,
	format?: ImageFormats,
	quality?: number,
	width?: number,
	height?: number,
): Promise<boolean> {
	return (await queue.add(() => {
		const reader = input.getReader();

		const nodeWritable = new Writable({
			async write(chunk: Buffer, _encoding, cb) {
				await output.write(chunk);
				cb();
			},
		});

		const nodeReadable = new Readable({
			async read() {
				const { done, value } = await reader.read();
				if (done) {
					this.push(null);
				} else {
					this.push(value);
				}
			},
		});

		let s = sharp();
		if ((width && !Number.isNaN(width)) || (height && !Number.isNaN(height))) {
			s = s.resize({ width, height });
		}

		if (format) {
			s = s.toFormat(format, { lossless: quality === 100, quality: quality !== 100 && !Number.isNaN(quality) ? quality : undefined });
		}

		const finalStream = nodeReadable.pipe(s).pipe(nodeWritable);

		return new Promise<boolean>((res, rej) => {
			if (!finalStream) {
				rej(new CDNError("transformImage", CDNErrorType.INVALID_FILE_FORMAT));
				output.close();
			}
			finalStream?.on("finish", () => {
				res(true);
				output.close();
			});
		});
	})) as boolean;
}
