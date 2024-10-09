import { type CDNError, CDNErrorType } from "#error";
import { type ErrorFactory, createErrorFactory } from "@huginn/backend-shared";
import { HttpCode, Errors } from "@huginn/shared";
import { type H3Event, setResponseStatus } from "h3";

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
