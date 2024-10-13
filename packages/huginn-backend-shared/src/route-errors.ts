import { Errors, HttpCode } from "@huginn/shared";
import type { Context } from "hono";
import { type ErrorFactory, createErrorFactory } from "./error-factory";
import { logServerError } from "./log-utils";

export function errorResponse(c: Context, factory: ErrorFactory, code: HttpCode = HttpCode.BAD_REQUEST): Response {
	return c.json(factory.toObject(), code);
}

export function notFound(c: Context, factory: ErrorFactory): Response {
	return errorResponse(c, factory, HttpCode.NOT_FOUND);
}

export function serverError(c: Context, e: Error, log = true): Response {
	if (log) {
		logServerError(c.req.path, e);
	}

	return errorResponse(c, createErrorFactory(Errors.serverError()), HttpCode.SERVER_ERROR);
}

export function unauthorized(c: Context): Response {
	return errorResponse(c, createErrorFactory(Errors.unauthorized()), HttpCode.UNAUTHORIZED);
}

export function invalidFormBody(c: Context): Response {
	return errorResponse(c, createErrorFactory(Errors.invalidFormBody()));
}

export function fileNotFound(c: Context): Response {
	return notFound(c, createErrorFactory(Errors.fileNotFound()));
}

export function invalidFileFormat(c: Context): Response {
	return errorResponse(c, createErrorFactory(Errors.invalidFileFormat()));
}
