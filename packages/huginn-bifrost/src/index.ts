import type { WebSocketHandler } from "bun";
import { Hono } from "hono";
import { cors } from "hono/cors";

const app = new Hono();

app.use(cors());

// Route requests based on the path
app.all("/api/*", async (c) => {
	const targetUrl = `http://localhost:3004${c.req.path}`;

	return fetch(targetUrl, c.req.raw);
});

app.all("/*", async (c) => {
	const targetUrl = `http://localhost:3002${c.req.path}`;

	return fetch(targetUrl, c.req.raw);
});

app.onError((error, c) => {
	console.log("Error on", c.req.path);
	return c.text("An endpoint is not connected");
});

const websocketHandler: WebSocketHandler<{ url: string; client: WebSocket }> = {
	open(serverSocket) {
		console.log("WebSocket connection established:", serverSocket.data.url);

		serverSocket.data.client.onmessage = (event) => {
			serverSocket.send(event.data);
		};

		serverSocket.data.client.onclose = (event) => {
			serverSocket.close(event.code, event.reason);
		};
	},

	close(serverSocket, code, reason) {
		serverSocket.data.client?.close(code, reason);
	},

	message(serverSocket, message) {
		serverSocket.data.client?.send(message);
	},
};

Bun.serve({
	async fetch(request, server) {
		if (request.url.includes("gateway")) {
			try {
				const targetUrl = "ws://localhost:3004/gateway";
				const clientSocket = new WebSocket(targetUrl);
				await new Promise((res, rej) => {
					clientSocket.onopen = () => {
						if (server.upgrade(request, { data: { url: request.url, client: clientSocket } })) {
							res(undefined);
							return;
						}
					};
					clientSocket.onerror = () => {
						rej(undefined);
					};
				});
				return;
			} catch (e) {
				return new Response("Upgrade failed", { status: 400 });
			}
		}
		return app.fetch(request, server);
	},
	websocket: websocketHandler,
	port: "3001",
});
