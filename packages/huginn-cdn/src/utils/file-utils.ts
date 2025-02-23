import { Readable, Writable } from "node:stream";
import { CDNError } from "@huginn/backend-shared";
import { CDNErrorType } from "@huginn/backend-shared/types";
import { type FileContentTypes, type FileFormats, fileTypes } from "@huginn/shared";
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

export async function transformImage(input: ReadableStream, output: StreamingApi, format: FileFormats, quality: number): Promise<boolean> {
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

		let finalStream: Writable;
		if (format === "jpeg" || format === "jpg") {
			finalStream = nodeReadable.pipe(sharp().jpeg({ quality })).pipe(nodeWritable);
		}
		if (format === "webp") {
			finalStream = nodeReadable.pipe(sharp().webp({ quality })).pipe(nodeWritable);
		}
		if (format === "png") {
			finalStream = nodeReadable.pipe(sharp().png({ quality })).pipe(nodeWritable);
		}
		if (format === "gif") {
			finalStream = nodeReadable.pipe(sharp().gif()).pipe(nodeWritable);
		}

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
