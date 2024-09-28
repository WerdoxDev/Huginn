import { type ErrorFactory, createErrorFactory, logReject, logRequest, logResponse, logServerError } from "@huginn/backend-shared";
import { Errors, HttpCode, type HuginnErrorData, generateRandomString } from "@huginn/shared";
import type { Server } from "bun";
import consola from "consola";
import { colors } from "consola/utils";
import {
	type App,
	type Router,
	createApp,
	createRouter,
	getResponseStatus,
	handleCors,
	send,
	setResponseHeader,
	setResponseStatus,
	toWebHandler,
} from "h3";
import { FileStorage } from "#storage/file-storage";
import { S3Storage } from "#storage/s3-storage";
import type { Storage } from "#storage/storage";
import { handleCommonCDNErrors } from "#utils/route-utils";
import { version } from "../package.json";
import { isCDNError } from "./error";
import { importRoutes } from "./routes";
import { CDN_HOST, CDN_PORT, CERT_FILE, KEY_FILE } from "./setup";

export async function startCdn(options?: { serve: boolean; storage: "aws" | "local" }): Promise<{ cdn?: Server; app: App; router: Router }> {
	consola.info(`Using version ${version}`);
	consola.info(`Using ${colors.yellow(options?.storage ?? "")} storage`);
	consola.start("Starting cdn...");

	const app = createApp({
		onError: options?.serve
			? (error, event) => {
					const id = event.context.id;

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

					// Common errors
					let errorFactory: ErrorFactory | undefined;
					if (isCDNError(error.cause)) {
						errorFactory = handleCommonCDNErrors(event, error.cause);
					}

					if (errorFactory) {
						const status = getResponseStatus(event);
						logReject(event.path, event.method, id, errorFactory.toObject(), status);

						setResponseHeader(event, "content-type", "application/json");
						return send(event, JSON.stringify(errorFactory.toObject()));
					}

					logServerError(event.path, error.cause as Error);
					logReject(event.path, event.method, id, "Server Error", HttpCode.SERVER_ERROR);

					setResponseStatus(event, HttpCode.SERVER_ERROR);
					return send(event, JSON.stringify(createErrorFactory(Errors.serverError()).toObject()));
				}
			: undefined,
		onBeforeResponse: options?.serve
			? (event, response) => {
					if (event.method === "OPTIONS") {
						return;
					}

					const id = event.context.id;
					const status = getResponseStatus(event);

					if (status >= 200 && status < 300) {
						logResponse(event.path, status, id, response.body);
					} else {
						logReject(event.path, event.method, id, response.body as HuginnErrorData, status);
					}
				}
			: undefined,
		onRequest: options?.serve
			? (event) => {
					if (handleCors(event, { origin: "*", preflight: { statusCode: 204 }, methods: "*" })) {
						return;
					}
					event.context.id = generateRandomString(6);
					const id = event.context.id;
					logRequest(event.path, event.method, id, undefined);
				}
			: undefined,
	});

	router = createRouter();
	storage = options?.storage === "aws" ? new S3Storage() : new FileStorage();

	await importRoutes();

	if (!options?.serve) {
		return { app, router };
	}

	const handler = toWebHandler(app);
	app.use(router);

	const cdn = Bun.serve<string>({
		cert: CERT_FILE,
		key: KEY_FILE,
		port: CDN_PORT,
		hostname: CDN_HOST,
		fetch(req) {
			return handler(req);
		},
	});

	consola.success("CDN started!");
	consola.box(`Listening on ${colors.yellow(cdn.url.href)}`);

	return { cdn, app, router };
}

export let router: Readonly<Router>;
export let storage: Storage;
