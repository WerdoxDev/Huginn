import { S3Client } from "@aws-sdk/client-s3";
import { type ErrorFactory, createErrorFactory, logReject, logRequest, logResponse, logServerError } from "@huginn/backend-shared";
import { Errors, HttpCode, type HuginnErrorData, generateRandomString } from "@huginn/shared";
import { join } from "@std/path";
import consola from "consola";
import { colors } from "consola/utils";
import {
	type App,
	type H3Error,
	type Router,
	createApp,
	createRouter,
	defineEventHandler,
	getResponseStatus,
	handleCors,
	readBody,
	send,
	setResponseHeader,
	setResponseStatus,
	toWebHandler,
	useBase,
} from "h3";
import { Octokit } from "octokit";
import { isDBError } from "./database/error.ts";
import { ServerGateway } from "./gateway/server-gateway.ts";
import { importRoutes } from "./routes.ts";
import { AWS_KEY_ID, AWS_REGION, AWS_SECRET_KEY, CERT_FILE_PATH, GITHUB_TOKEN, KEY_FILE_PATH, SERVER_HOST, SERVER_PORT } from "./setup.ts";
import { handleCommonDBErrors } from "./utils/route-utils.ts";
import { TokenInvalidator } from "./utils/token-invalidator.ts";

const version = JSON.parse(Deno.readTextFileSync(join(Deno.cwd(), "deno.json"))).version as string;

export async function startServer(options?: { serve: boolean }): Promise<{ server?: Deno.HttpServer; app: App; router: Router }> {
	consola.info(`Using version ${version}`);
	consola.start("Starting server...");

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
					if (isDBError(error.cause)) {
						errorFactory = handleCommonDBErrors(event, error.cause);
					}

					if (errorFactory) {
						const status = getResponseStatus(event);
						logReject(event.path, event.method, id, errorFactory.toObject(), status);

						setResponseHeader(event, "content-type", "application/json");
						return send(event, JSON.stringify(errorFactory.toObject()));
					}

					logServerError(event.path, error.cause as H3Error);
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

	const mainRouter = createRouter();
	router = createRouter();

	await importRoutes();

	mainRouter.get(
		"/",
		defineEventHandler(() => {
			return '<div style="height:100%; display: flex; align-items:center; justify-content:center;"><div style="font-size: 2rem;">Huginn API Homepage</div></div>';
		}),
	);

	mainRouter.use("/api/**", useBase("/api", router.handler));

	if (!options?.serve) {
		return { app, router: mainRouter };
	}

	const handler = toWebHandler(app);
	app.use(mainRouter);

	const server = Deno.serve(
		{
			...(CERT_FILE_PATH &&
				KEY_FILE_PATH && {
					cert: CERT_FILE_PATH ? Deno.readTextFileSync(CERT_FILE_PATH) : undefined,
					key: KEY_FILE_PATH ? Deno.readTextFileSync(KEY_FILE_PATH) : undefined,
				}),
			hostname: SERVER_HOST,
			port: SERVER_PORT,
		},
		async (req, server) => {
			const url = new URL(req.url);
			if (url.pathname === "/gateway") {
				const response = await gateway.ws.handleUpgrade(req, server);

				if (response) {
					return response;
				}

				return new Response(JSON.stringify(createErrorFactory(Errors.websocketFail())), { status: HttpCode.BAD_REQUEST });
			}

			return handler(req);
		},
	);

	consola.success("Server started!");
	consola.box(`Listening on ${colors.green(`${server.addr.hostname}:${server.addr.port}`)}`);
	// one year theve been watching me, so many pills they fed me (6), when a loud hour comes (2), i tremble everytime the light falls (watch it go dark, every second 2 blinks)
	return { server, app, router: mainRouter };
}

export const gateway = new ServerGateway({ logHeartbeat: false });
export const tokenInvalidator = new TokenInvalidator();
export const octokit: Octokit = new Octokit({ auth: GITHUB_TOKEN });
export const s3 = new S3Client({
	region: AWS_REGION,
	credentials: { accessKeyId: AWS_KEY_ID ?? "", secretAccessKey: AWS_SECRET_KEY ?? "" },
});
export let router: Readonly<Router>;
