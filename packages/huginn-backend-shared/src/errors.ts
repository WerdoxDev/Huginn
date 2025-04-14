import { Errors, HttpCode, type JsonCode } from "@huginn/shared";
import type { Context } from "hono";
import type { ContentfulStatusCode } from "hono/utils/http-status";
import type { CDNErrorType, DBErrorType } from "#types";
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

export function createHuginnError(c: Context, errorFactory: ErrorFactory, status: ContentfulStatusCode = HttpCode.BAD_REQUEST) {
	return c.json(errorFactory.toObject(), status);
}

export function unauthorized(c: Context) {
	return createHuginnError(c, createErrorFactory(Errors.unauthorized()), HttpCode.UNAUTHORIZED);
}

export function forbidden(c: Context) {
	return createHuginnError(c, createErrorFactory(Errors.forbidden()), HttpCode.FORBIDDEN);
}

export function invalidFormBody(c: Context) {
	return createHuginnError(c, createErrorFactory(Errors.invalidFormBody()));
}

export function fileNotFound(c: Context) {
	return createHuginnError(c, createErrorFactory(Errors.fileNotFound()), HttpCode.NOT_FOUND);
}

export function invalidFileFormat(c: Context) {
	return createHuginnError(c, createErrorFactory(Errors.invalidFileFormat()));
}

export function missingAccess(c: Context) {
	return createHuginnError(c, createErrorFactory(Errors.missingAccess()), HttpCode.FORBIDDEN);
}

export function missingPermission(c: Context) {
	return createHuginnError(c, createErrorFactory(Errors.missingPermission()), HttpCode.FORBIDDEN);
}

export function notFound(c: Context) {
	return c.text("Not Found", HttpCode.NOT_FOUND);
}

export function singleError(c: Context, error: [string, JsonCode], status: ContentfulStatusCode = HttpCode.BAD_REQUEST) {
	return createHuginnError(c, createErrorFactory(error), status);
}
