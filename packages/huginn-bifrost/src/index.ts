import type { WebSocketHandler } from "bun";
import { Hono } from "hono";

const app = new Hono();

// Route requests based on the path
app.all("/api/*", async (c) => {
	const targetUrl = `http://localhost:3004${c.req.path}`;

	return fetch(targetUrl, c.req.raw);
});

const websocketHandler: WebSocketHandler<{ url: string; client: WebSocket | undefined }> = {
	open(serverSocket) {
		console.log("WebSocket connection established:", serverSocket.data.url);

		// Determine target server based on path
		let targetUrl: string | undefined;
		if (serverSocket.data.url.startsWith("http://localhost:3001/gateway")) {
			targetUrl = "ws://localhost:3004/gateway";
		} else {
			serverSocket.close(4001, "Unknown WebSocket route");
			return;
		}

		// Create a WebSocket connection to the target server
		const clientSocket = new WebSocket(targetUrl);
		serverSocket.data.client = clientSocket;

		clientSocket.onmessage = (event) => {
			serverSocket.send(event.data);
		};

		clientSocket.onclose = (event) => {
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
	fetch(request, server) {
		if (request.url.includes("gateway")) {
			if (server.upgrade(request, { data: { url: request.url, client: undefined } })) {
				return;
			}
		}
		return app.fetch(request, server);
	},
	websocket: websocketHandler,
	port: "3001",
});
