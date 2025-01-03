import { stat } from "node:fs/promises";
import { S3Client } from "@aws-sdk/client-s3";
import { type ErrorFactory, createErrorFactory, logReject, logRequest, logResponse, logServerError } from "@huginn/backend-shared";
import { Errors, HttpCode, type HuginnErrorData, generateRandomString } from "@huginn/shared";
import type { Server } from "bun";
import consola from "consola";
import { colors } from "consola/utils";
import {
	type App,
	type H3Error,
	type PlainHandler,
	type Router,
	createApp,
	createRouter,
	defineEventHandler,
	eventHandler,
	getResponseStatus,
	handleCors,
	readBody,
	send,
	serveStatic,
	setResponseHeader,
	setResponseStatus,
	toPlainHandler,
	toWebHandler,
	useBase,
} from "h3";
import { Octokit } from "octokit";
import { join } from "pathe";
import { isDBError } from "#database/error";
import { ServerGateway } from "#gateway/server-gateway";
import { importRoutes } from "#routes";
import { CERT_FILE, KEY_FILE, envs } from "#setup";
import { handleCommonDBErrors } from "#utils/route-utils";
import { TokenInvalidator } from "#utils/token-invalidator";
import { version } from "../package.json";

export async function startServer(options?: { serve: boolean; defineOptions: boolean; logRoutes?: boolean }): Promise<{
	server?: Server;
	app: App;
	router: Router;
	handler: PlainHandler;
}> {
	consola.info(`Using version ${version}`);
	consola.start("Starting server...");

	const app = createApp({
		onError: options?.defineOptions
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
					if (isDBError(error.cause)) {
						errorFactory = handleCommonDBErrors(event, error.cause);
					}

					if (errorFactory) {
						const status = getResponseStatus(event);
						logReject(event.path, event.method, id, errorFactory.toObject(), status);

						setResponseHeader(event, "content-type", "application/json");
						return send(event, JSON.stringify(errorFactory.toObject()));
					}

					console.log(error);
					logServerError(event.path, error.cause as H3Error);
					logReject(event.path, event.method, id, "Server Error", HttpCode.SERVER_ERROR);

					setResponseStatus(event, HttpCode.SERVER_ERROR);
					return send(event, JSON.stringify(createErrorFactory(Errors.serverError()).toObject()));
				}
			: undefined,
		onAfterResponse: options?.defineOptions
			? async (event, response) => {
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
			: undefined,
		onRequest: options?.defineOptions
			? async (event) => {
					if (handleCors(event, { origin: "*", preflight: { statusCode: 204 }, methods: "*" })) {
						return;
					}
					event.context.id = generateRandomString(6);
					const id = event.context.id;
					logRequest(event.path, event.method, id, event.method !== "GET" ? await readBody(event) : undefined);
				}
			: undefined,
	});

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

	mainRouter = createRouter();
	router = createRouter();

	await importRoutes(options?.logRoutes);

	mainRouter.get(
		"/",
		defineEventHandler(() => {
			return '<div style="height:100%; display: flex; align-items:center; justify-content:center;"><div style="font-size: 2rem;">Huginn API Homepage</div></div>';
		}),
	);

	mainRouter.use("/api/**", useBase("/api", router.handler));

	if (!options?.serve) {
		return { app, router: mainRouter, handler: toPlainHandler(app) };
	}

	const handler = toWebHandler(app);
	app.use(mainRouter);

	const server = Bun.serve({
		tls: {
			cert: CERT_FILE,
			key: KEY_FILE,
			passphrase: envs.PASSPHRASE,
		},
		port: envs.SERVER_PORT,
		hostname: envs.SERVER_HOST,
		async fetch(req, server) {
			const url = new URL(req.url);
			if (url.pathname === "/gateway") {
				const response = await gateway.internalWS.handleUpgrade(req, server);

				if (response) {
					return response;
				}

				return new Response(JSON.stringify(createErrorFactory(Errors.websocketFail())), { status: HttpCode.BAD_REQUEST });
			}

			return handler(req);
		},
		websocket: gateway.internalWS.websocket,
	});

	consola.success("Server started!");
	consola.box(`Listening on ${colors.green(server.url.href)}`);

	return { server, app, router: mainRouter, handler: toPlainHandler(app) };
}

export const gateway = new ServerGateway({ logHeartbeat: false });
export const tokenInvalidator = new TokenInvalidator();
export const octokit: Octokit = new Octokit({ auth: envs.GITHUB_TOKEN });
export const s3 = new S3Client({
	region: envs.AWS_REGION,
	credentials: { accessKeyId: envs.AWS_KEY_ID ?? "", secretAccessKey: envs.AWS_SECRET_KEY ?? "" },
});
export let router: Readonly<Router>;
export let mainRouter: Readonly<Router>;
