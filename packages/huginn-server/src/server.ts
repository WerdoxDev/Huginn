import { S3Client } from "@aws-sdk/client-s3";
import {
	commonHandlers,
	createErrorFactory,
	handleCommonError,
	handleErrorFactory,
	handleServerError,
	serverOnError,
	sharedOnAfterResponse,
	sharedOnRequest,
} from "@huginn/backend-shared";
import { Errors, HttpCode } from "@huginn/shared";
import type { Server } from "bun";
import consola from "consola";
import { colors } from "consola/utils";
import { type App, type PlainHandler, type Router, createApp, createRouter, defineEventHandler, toPlainHandler, toWebHandler, useBase } from "h3";
import { Octokit } from "octokit";
import { ServerGateway } from "#gateway/server-gateway";
import { importRoutes } from "#routes";
import { CERT_FILE, KEY_FILE, envs } from "#setup";
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
					const commonError = handleCommonError(error, event, id);
					if (commonError) return commonError;

					const errorFactory = serverOnError(error, event, undefined);
					if (errorFactory) return handleErrorFactory(event, errorFactory, id);

					return handleServerError(error, event, id);
				}
			: undefined,
		onAfterResponse: options?.defineOptions
			? (event, response) => {
					return sharedOnAfterResponse(event, response);
				}
			: undefined,
		onRequest: options?.defineOptions
			? async (event) => {
					return await sharedOnRequest(event);
				}
			: undefined,
	});

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

	commonHandlers(app);

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
