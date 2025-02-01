import { Errors, HttpCode, type HuginnErrorData, generateRandomString } from "@huginn/shared";
import type { Context } from "hono";
import { CDNErrorType, DBErrorType } from "../types";
import { createErrorFactory } from "./error-factory";
import { createHuginnError, isCDNError, isDBError } from "./errors";
import { logReject, logRequest, logResponse, logServerError } from "./log-utils";

export function serverOnError(error: Error, c: Context) {
	if (!isDBError(error)) return;

	if (error.isErrorType(DBErrorType.INVALID_ID)) {
		return createHuginnError(c, createErrorFactory(Errors.invalidId(error.cause)), HttpCode.BAD_REQUEST);
	}
	if (error.isErrorType(DBErrorType.NULL_USER)) {
		return createHuginnError(c, createErrorFactory(Errors.unknownUser(error.cause)), HttpCode.NOT_FOUND);
	}
	if (error.isErrorType(DBErrorType.NULL_RELATIONSHIP)) {
		return createHuginnError(c, createErrorFactory(Errors.unknownRelationship(error.cause)), HttpCode.NOT_FOUND);
	}
	if (error.isErrorType(DBErrorType.NULL_CHANNEL)) {
		return createHuginnError(c, createErrorFactory(Errors.unknownChannel(error.cause)), HttpCode.NOT_FOUND);
	}
	if (error.isErrorType(DBErrorType.NULL_MESSAGE)) {
		return createHuginnError(c, createErrorFactory(Errors.unknownMessage(error.cause)), HttpCode.NOT_FOUND);
	}

	return;
}

export function cdnOnError(error: Error, c: Context) {
	if (!isCDNError(error)) return;

	if (error.isErrorType(CDNErrorType.FILE_NOT_FOUND)) {
		return createHuginnError(c, createErrorFactory(Errors.fileNotFound()), HttpCode.NOT_FOUND);
	}
	if (error.isErrorType(CDNErrorType.INVALID_FILE_FORMAT)) {
		return createHuginnError(c, createErrorFactory(Errors.invalidFileFormat()), HttpCode.BAD_REQUEST);
	}

	return;
}

export function handleServerError(error: Error, c: Context) {
	const id = c.get("id");
	const time = performance.now() - c.get("startTime");

	logServerError(c.req.path, error);
	logReject(c.req.path, c.req.method, time.toFixed(2), id, "Server Error", HttpCode.SERVER_ERROR);

	return c.json(createErrorFactory(Errors.serverError()).toObject(), HttpCode.SERVER_ERROR);
}

export async function sharedOnAfterResponse(c: Context): Promise<void> {
	if (c.req.method === "OPTIONS") {
		return;
	}

	const clone = c.res.clone();
	const contentType = c.res.headers.get("Content-Type");
	const body = contentType?.includes("application/json") ? await clone.json() : contentType?.includes("text/plain") ? await clone.text() : undefined;

	const id = c.get("id");
	const time = performance.now() - c.get("startTime");
	const status = c.res.status;

	if (status >= 200 && status < 400) {
		logResponse(c.req.path, status, time.toFixed(2), id, body);
	} else {
		logReject(c.req.path, c.req.method, time.toFixed(2), id, body ? (body as HuginnErrorData) : body, status);
	}

	// Promise.allSettled(event.context.huginnWaitUntilPromises?.map((x) => x()) ?? []);
}

export function sharedOnRequest(c: Context) {
	c.set("startTime", performance.now());
	const id = generateRandomString(6);
	c.set("id", id);
	logRequest(c.req.path, c.req.method, id, c.req.method !== "GET" ? c.req.parseBody() : undefined);
}

export function commonHandlers(nitroApp: NitroApp): void {
	nitroApp.hooks.hook("request", async (event) => {
		event.huginWaitUntil = (promise) => {
			if (!event.context.huginnWaitUntilPromises) {
				event.context.huginnWaitUntilPromises = [];
			}
			event.context.huginnWaitUntilPromises.push(promise);
		};
	});
}
