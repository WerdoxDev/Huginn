import { describe, expect, test } from "bun:test";
import { HuginnClient } from "../client/huginn-client";

describe("Gateway", () => {
	test("should connect and emit 'open' event", async (done) => {
		const client = new HuginnClient({
			gateway: {
				createSocket(url) {
					return new WebSocket(url);
				},
				url: "ws://localhost:3001/gateway",
				log: false,
			},
		});

		client.gateway.connect();
		client.gateway.on("open", () => {
			done();
		});

		expect(client.gateway.socket).toBeDefined();
	});
});
