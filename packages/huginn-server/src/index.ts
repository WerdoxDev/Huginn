import {
	handleServerError,
	importRoutes,
	notFound,
	serverOnError,
	setAppInstance,
	sharedOnAfterResponse,
	sharedOnRequest,
} from "@huginn/backend-shared";
import consola from "consola";
import { Hono } from "hono";
import { CookieStore, sessionMiddleware } from "hono-sessions";
import { serveStatic } from "hono/bun";
import { cors } from "hono/cors";
import { showRoutes } from "hono/dev";
import { createMiddleware } from "hono/factory";
import { ws } from "#routes/gateway";
import { envs } from "#setup";

const app = new Hono().use(cors());
setAppInstance(app);

const store = new CookieStore();

app.notFound((c) => {
	return notFound(c);
});

app.onError((error, c) => {
	if (process.env.TEST) {
		console.log(error);
	}

	const returnedError = serverOnError(error, c);
	if (returnedError) {
		return returnedError;
	}

	return handleServerError(error, c);
});

app.all(
	"*",
	sessionMiddleware({
		store,
		encryptionKey: envs.SESSION_PASSWORD,
		expireAfterSeconds: 900,
		cookieOptions: { sameSite: "Lax", path: "/", httpOnly: true },
	}),
);

app.use(
	"*",
	createMiddleware(async (c, next) => {
		await sharedOnRequest(c);
		await next();

		if (!c.error) {
			await sharedOnAfterResponse(c);
		}
	}),
);

export { app };

await importRoutes();

app.use("*", serveStatic({ root: "./src/static" }));

showRoutes(app, { colorize: true, verbose: false });

const server = Bun.serve({
	websocket: ws.websocket,
	fetch(req, server) {
		if (req.headers.get("upgrade") === "websocket") {
			return ws.handleUpgrade(req, server);
		}

		return app.fetch(req, server);
	},
	hostname: envs.SERVER_HOST,
	port: envs.SERVER_PORT,
	idleTimeout: 40,
});

if (process.env.TEST) {
	console.log(`Listening on ${server.hostname}:${server.port}`);
} else {
	consola.box(`Listening on ${server.hostname}:${server.port}`);
}
