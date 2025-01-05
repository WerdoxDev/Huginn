import { Errors, HttpCode, type HuginnErrorData, type JsonCode } from "@huginn/shared";
import { type H3Event, setResponseStatus } from "h3";
import type { CDNErrorType, DBErrorType } from "../types";
import { type ErrorFactory, createErrorFactory } from "./error-factory";

export class DBError extends Error {
	public constructor(
		public callerName: string,
		public type: DBErrorType,
		public cause?: string,
	) {
		super(`Unhandeled Database Error => ${callerName} => ${type}: ${cause ? `(${cause})` : ""}`, {
			cause: cause,
		});
	}

	isErrorType(type: DBErrorType): boolean {
		return this.type === type;
	}
}

export class CDNError extends Error {
	public constructor(
		public callerName: string,
		public type: CDNErrorType,
		public cause?: string,
	) {
		super(`Unhandeled CDN Error => ${callerName} => ${type}: ${cause ? `(${cause})` : ""}`, {
			cause: cause,
		});
	}

	isErrorType(type: CDNErrorType): boolean {
		return this.type === type;
	}
}

export function isDBError(object: unknown): object is DBError {
	if (object !== null && typeof object === "object" && object instanceof DBError) {
		return true;
	}

	return false;
}

export function isCDNError(object: unknown): object is CDNError {
	if (object !== null && typeof object === "object" && object instanceof CDNError) {
		return true;
	}

	return false;
}

export function createHuginnError(event: H3Event, errorFactory: ErrorFactory, status: HttpCode = HttpCode.BAD_REQUEST): HuginnErrorData {
	setResponseStatus(event, status);
	return errorFactory.toObject();
}

export function unauthorized(event: H3Event): HuginnErrorData {
	return createHuginnError(event, createErrorFactory(Errors.unauthorized()), HttpCode.UNAUTHORIZED);
}

export function forbidden(event: H3Event): HuginnErrorData {
	return createHuginnError(event, createErrorFactory(Errors.forbidden()), HttpCode.FORBIDDEN);
}

export function invalidFormBody(event: H3Event): HuginnErrorData {
	return createHuginnError(event, createErrorFactory(Errors.invalidFormBody()));
}

export function fileNotFound(event: H3Event): HuginnErrorData {
	return createHuginnError(event, createErrorFactory(Errors.fileNotFound()), HttpCode.NOT_FOUND);
}

export function invalidFileFormat(event: H3Event): HuginnErrorData {
	return createHuginnError(event, createErrorFactory(Errors.invalidFileFormat()));
}

export function missingAccess(event: H3Event): HuginnErrorData {
	return createHuginnError(event, createErrorFactory(Errors.missingAccess()), HttpCode.FORBIDDEN);
}

export function missingPermission(event: H3Event): HuginnErrorData {
	return createHuginnError(event, createErrorFactory(Errors.missingPermission()), HttpCode.FORBIDDEN);
}

export function singleError(event: H3Event, error: [string, JsonCode], status: HttpCode = HttpCode.BAD_REQUEST): HuginnErrorData {
	return createHuginnError(event, createErrorFactory(error), status);
}
