import { describe, expect, test } from "bun:test";
import { HuginnClient } from "../huginn-client";

describe("CDN", () => {
	test("should resolve a CDN request url", async () => {
		const client = new HuginnClient({ cdn: { url: "https://test.com" } });

		const url = client.cdn.makeURL("/test", { size: 128, format: "png" });
		expect(url).toBe("https://test.com/test.png?size=128");
	});

	test("should resolve a CDN gif request url", async () => {
		const client = new HuginnClient({ cdn: { url: "https://test.com" } });

		const url = client.cdn.dynamicMakeURL("/test", "a_123", { size: 128 });
		expect(url).toBe("https://test.com/test.gif?size=128");
	});
});
