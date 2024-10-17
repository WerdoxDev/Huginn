import { type ErrorFactory, createErrorFactory } from "@huginn/backend-shared";
import { Errors, HttpCode } from "@huginn/shared";
import { type H3Event, setResponseHeader, setResponseStatus } from "h3";
import { storage } from "#cdn";
import { type CDNError, CDNErrorType } from "#error";
import type { FileCategory } from "#types";
import { extractFileInfo, findImageByName, transformImage } from "./file-utils";

export function handleCommonCDNErrors(event: H3Event, error: CDNError) {
	let errorFactory: ErrorFactory | undefined;

	if (error.isErrorType(CDNErrorType.FILE_NOT_FOUND)) {
		setResponseStatus(event, HttpCode.NOT_FOUND);
		errorFactory = createErrorFactory(Errors.fileNotFound());
	}
	if (error.isErrorType(CDNErrorType.INVALID_FILE_FORMAT)) {
		setResponseStatus(event, HttpCode.BAD_REQUEST);
		errorFactory = createErrorFactory(Errors.invalidFileFormat());
	}

	return errorFactory;
}

export async function tryResolveImage(event: H3Event, category: FileCategory, subDirectory: string, hash: string) {
	const { name, format, mimeType } = extractFileInfo(hash);

	// Best scenario, file already exists and ready to serve
	const file = await storage.getFile(category, subDirectory, `${name}.${format}`);

	if (file) {
		setResponseStatus(event, HttpCode.OK);
		setResponseHeader(event, "Content-Type", mimeType);
		return new Blob([file]);
	}

	// File doesn't exist so we have to see if another format exists
	const { file: otherFile } = await findImageByName(category, subDirectory, name);

	const result = await transformImage(otherFile, format, 100);
	await storage.writeFile(category, subDirectory, hash, result);

	setResponseStatus(event, HttpCode.OK);
	setResponseHeader(event, "Content-Type", mimeType);
	return new Blob([result]);
}
