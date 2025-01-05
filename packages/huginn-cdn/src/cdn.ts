import {
	cdnOnError,
	commonHandlers,
	handleCommonError,
	handleErrorFactory,
	handleServerError,
	sharedOnAfterResponse,
	sharedOnRequest,
} from "@huginn/backend-shared";
import type { Server } from "bun";
import consola from "consola";
import { colors } from "consola/utils";
import { type App, type Router, createApp, createRouter, defineEventHandler, toWebHandler } from "h3";
import { FileStorage } from "#storage/file-storage";
import { S3Storage } from "#storage/s3-storage";
import type { Storage } from "#storage/storage";
import { version } from "../package.json";
import { importRoutes } from "./routes";
import { CERT_FILE, KEY_FILE, envs } from "./setup";

export async function startCdn(options?: { serve: boolean; defineOptions: boolean; storage: "aws" | "local" }): Promise<{
	cdn?: Server;
	app: App;
	router: Router;
}> {
	consola.info(`Using version ${version}`);
	consola.info(`Using ${colors.yellow(options?.storage ?? "")} storage`);
	consola.start("Starting cdn...");

	const app = createApp({
		onError: options?.defineOptions
			? (error, event) => {
					const id = event.context.id;
					const commonError = handleCommonError(error, event, id);
					if (commonError) return commonError;

					const errorFactory = cdnOnError(error, event, undefined);
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

	router = createRouter();
	storage = options?.storage === "aws" ? new S3Storage() : new FileStorage();

	await importRoutes();

	router.get(
		"/",
		defineEventHandler(() => {
			return '<div style="height:100%; display: flex; align-items:center; justify-content:center;"><div style="font-size: 2rem;">Huginn CDN Homepage</div></div>';
		}),
	);

	if (!options?.serve) {
		return { app, router };
	}

	commonHandlers(app);

	const handler = toWebHandler(app);
	app.use(router);

	const cdn = Bun.serve<string>({
		tls: {
			cert: CERT_FILE,
			key: KEY_FILE,
			passphrase: envs.PASSPHRASE,
		},
		port: envs.CDN_PORT,
		hostname: envs.CDN_HOST,
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
