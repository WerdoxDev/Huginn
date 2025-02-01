import {
	cdnOnError,
	handleServerError,
	importRoutes,
	notFound,
	setAppInstance,
	sharedOnAfterResponse,
	sharedOnRequest,
} from "@huginn/backend-shared";
import { Hono } from "hono";
import { showRoutes } from "hono/dev";
import { createMiddleware } from "hono/factory";
import { envs } from "#setup";

const app = new Hono();
setAppInstance(app);

app.all(
	"*",
	createMiddleware(async (c, next) => {
		sharedOnRequest(c);
		await next();

		if (c.res.ok) {
			await sharedOnAfterResponse(c);
		}
	}),
);

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

if (!process.env.test) {
	Bun.serve({
		fetch: app.fetch,
		hostname: envs.CDN_HOST,
		port: envs.CDN_PORT,
	});
}
