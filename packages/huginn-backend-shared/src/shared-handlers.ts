import { Errors, HttpCode, type HuginnErrorData, generateRandomString } from "@huginn/shared";
import {
	type App,
	type H3Error,
	type H3Event,
	eventHandler,
	getResponseStatus,
	handleCors,
	readBody,
	send,
	setResponseHeader,
	setResponseStatus,
} from "h3";
import { CDNErrorType, DBErrorType } from "../types";
import { type ErrorFactory, createErrorFactory } from "./error-factory";
import { isCDNError, isDBError } from "./errors";
import { logReject, logRequest, logResponse, logServerError } from "./log-utils";

export function serverOnError(error: H3Error, event: H3Event, errorFactory: ErrorFactory | undefined): ErrorFactory | undefined {
	if (!isDBError(error.cause)) return errorFactory;

	if (error.cause.isErrorType(DBErrorType.INVALID_ID)) {
		setResponseStatus(event, HttpCode.BAD_REQUEST);
		return createErrorFactory(Errors.invalidId(error.cause.cause));
	}
	if (error.cause.isErrorType(DBErrorType.NULL_USER)) {
		setResponseStatus(event, HttpCode.NOT_FOUND);
		return createErrorFactory(Errors.unknownUser(error.cause.cause));
	}
	if (error.cause.isErrorType(DBErrorType.NULL_RELATIONSHIP)) {
		setResponseStatus(event, HttpCode.NOT_FOUND);
		return createErrorFactory(Errors.unknownRelationship(error.cause.cause));
	}
	if (error.cause.isErrorType(DBErrorType.NULL_CHANNEL)) {
		setResponseStatus(event, HttpCode.NOT_FOUND);
		return createErrorFactory(Errors.unknownChannel(error.cause.cause));
	}
	if (error.cause.isErrorType(DBErrorType.NULL_MESSAGE)) {
		setResponseStatus(event, HttpCode.NOT_FOUND);
		return createErrorFactory(Errors.unknownMessage(error.cause.cause));
	}

	return errorFactory;
}

export function cdnOnError(error: H3Error, event: H3Event, errorFactory: ErrorFactory | undefined): ErrorFactory | undefined {
	if (!isCDNError(error.cause)) return errorFactory;

	if (error.cause.isErrorType(CDNErrorType.FILE_NOT_FOUND)) {
		setResponseStatus(event, HttpCode.NOT_FOUND);
		return createErrorFactory(Errors.fileNotFound());
	}
	if (error.cause.isErrorType(CDNErrorType.INVALID_FILE_FORMAT)) {
		setResponseStatus(event, HttpCode.BAD_REQUEST);
		return createErrorFactory(Errors.invalidFileFormat());
	}

	return errorFactory;
}

export function handleCommonError(error: H3Error, event: H3Event, id: string): Promise<void> | undefined {
	if (error.cause && !(error.cause instanceof Error) && typeof error.cause === "object" && "errors" in error.cause) {
		const status = getResponseStatus(event);
		logReject(event.path, event.method, id, error.cause as HuginnErrorData, status);
		return send(event, JSON.stringify(error.cause), "application/json");
	}
	if (error.statusCode === HttpCode.NOT_FOUND) {
		setResponseStatus(event, HttpCode.NOT_FOUND, "Not Found");
		logReject(event.path, event.method, id, undefined, HttpCode.NOT_FOUND);
		return send(event, `${event.path} Not Found`);
	}
}

export function handleErrorFactory(event: H3Event, errorFactory: ErrorFactory, id: string): Promise<void> {
	const status = getResponseStatus(event);
	logReject(event.path, event.method, id, errorFactory.toObject(), status);

	setResponseHeader(event, "content-type", "application/json");
	return send(event, JSON.stringify(errorFactory.toObject()));
}

export function handleServerError(error: H3Error, event: H3Event, id: string): Promise<void> {
	logServerError(event.path, error.cause as H3Error);
	logReject(event.path, event.method, id, "Server Error", HttpCode.SERVER_ERROR);

	setResponseStatus(event, HttpCode.SERVER_ERROR);
	return send(event, JSON.stringify(createErrorFactory(Errors.serverError()).toObject()));
}

export function sharedOnAfterResponse(event: H3Event, response: { body?: unknown } | undefined): void {
	if (event.method === "OPTIONS") {
		return;
	}

	const id = event.context.id;
	const status = getResponseStatus(event);

	if (status >= 200 && status < 500) {
		logResponse(event.path, status, id, response?.body);
	} else {
		logReject(event.path, event.method, id, response?.body as HuginnErrorData, status);
	}

	Promise.all(event.context.waitUntilPromises?.map((x) => x()) ?? []);
}

export async function sharedOnRequest(event: H3Event): Promise<void> {
	if (handleCors(event, { origin: "*", preflight: { statusCode: 204 }, methods: "*" })) {
		return;
	}

	event.context.id = generateRandomString(6);
	const id = event.context.id;
	logRequest(event.path, event.method, id, event.method !== "GET" ? await readBody(event) : undefined);
}

export function commonHandlers(app: App): void {
	app.use(
		eventHandler((event) => {
			event.waitUntil = (promise) => {
				if (!event.context.waitUntilPromises) {
					event.context.waitUntilPromises = [];
				}
				event.context.waitUntilPromises.push(promise);
			};
		}),
	);
}
