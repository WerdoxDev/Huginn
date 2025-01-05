import {
	commonHandlers,
	createErrorFactory,
	handleCommonError,
	handleErrorFactory,
	handleServerError,
	readEnv,
	serverOnError,
	sharedOnAfterResponse,
	sharedOnRequest,
} from "@huginn/backend-shared";
import { router as cdnRouter } from "@huginn/cdn";
import { router as serverRouter } from "@huginn/server";
import { gateway } from "@huginn/server/src/server";
import { Errors, HttpCode } from "@huginn/shared";
import type { Serve, Server } from "bun";
import consola from "consola";
import { colors } from "consola/utils";
import { createApp, createRouter, defineEventHandler, eventHandler, toWebHandler } from "h3";

const app = createApp({
	onError(error, event) {
		const id = event.context.id;
		const commonError = handleCommonError(error, event, id);
		if (commonError) return commonError;

		const errorFactory = serverOnError(error, event, undefined);
		if (errorFactory) return handleErrorFactory(event, errorFactory, id);

		return handleServerError(error, event, id);
	},
	onAfterResponse(event, response) {
		return sharedOnAfterResponse(event, response);
	},
	async onRequest(event) {
		return await sharedOnRequest(event);
	},
});

commonHandlers(app);

const router = createRouter();

router.use(
	"/**",
	defineEventHandler(async (event) => {
		let result = await serverRouter.handler(event);

		if (!result) {
			result = await cdnRouter.handler(event);
		}

		return result;
	}),
);

app.use(router);

const handler = toWebHandler(app);

const envs = readEnv(["HOST", "PORT", "PASSPHRASE", "CERTIFICATE_PATH", "PRIVATE_KEY_PATH"] as const);

const CERT_FILE = envs.CERTIFICATE_PATH && Bun.file(envs.CERTIFICATE_PATH);
const KEY_FILE = envs.PRIVATE_KEY_PATH && Bun.file(envs.PRIVATE_KEY_PATH);
const PASSPHRASE = process.env.PASSPHRASE;

let server: Server;
const options: Serve = {
	port: envs.PORT,
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
	tls: {
		cert: CERT_FILE,
		key: KEY_FILE,
		passphrase: PASSPHRASE,
	},
};

try {
	server = Bun.serve({
		...options,
		hostname: envs.HOST,
		websocket: gateway.internalWS.websocket,
	});
} catch {
	server = Bun.serve({ ...options, hostname: "localhost", websocket: gateway.internalWS.websocket });
}

consola.success("Bifrost started!");
consola.box(`Listening on ${colors.magenta(server.url.href)}`);
