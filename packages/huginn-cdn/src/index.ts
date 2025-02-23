import {
	cdnOnError,
	handleServerError,
	importRoutes,
	notFound,
	setAppInstance,
	sharedOnAfterResponse,
	sharedOnRequest,
} from "@huginn/backend-shared";
import consola from "consola";
import { Hono } from "hono";
import { cache } from "hono/cache";
import { cors } from "hono/cors";
import { showRoutes } from "hono/dev";
import { createMiddleware } from "hono/factory";
import sharp from "sharp";
import { envs } from "#setup";

const app = new Hono().use(cors());
setAppInstance(app);

app.all(
	"*",
	createMiddleware(async (c, next) => {
		await sharedOnRequest(c);
		await next();

		if (!c.error) {
			await sharedOnAfterResponse(c);
		}
	}),
);
// disable caching
app.get("*", cache({ cacheName: "cdn", cacheControl: "public, max-age=31536000" }));

app.onError((error, c) => {
	const returnedError = cdnOnError(error, c);
	if (returnedError) {
		return returnedError;
	}

	console.log(error);

	return handleServerError(error, c);
});

app.notFound((c) => {
	return notFound(c);
});

export { app };

await importRoutes();
showRoutes(app, { colorize: true, verbose: false });

consola.box(`Listening on ${envs.CDN_HOST}:${envs.CDN_PORT}`);

if (!process.env.test) {
	Bun.serve({
		fetch: app.fetch,
		hostname: envs.CDN_HOST,
		port: envs.CDN_PORT,
		idleTimeout: 40,
	});
}
