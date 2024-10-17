import { expect, test } from "bun:test";
import path from "node:path";
import type { HuginnErrorFieldInformation } from "@huginn/shared";
import { CDN_HOST, CDN_PORT, UPLOADS_DIR } from "../setup";

const url = `http://${CDN_HOST}:${CDN_PORT}`;

it("POST /avatars/123 empty is ok", async () => {
	const result = await fetch(`${url}/avatars/123`, { method: "POST" });

	expect(result.status).not.toBe(500);
});

it("POST /avatars/123 is ok", async () => {
	const formData = new FormData();
	formData.append("files[0]", Bun.file(path.resolve(__dirname, "pixel.png")), "pixel.png");

	const result = await fetch(`${url}/avatars/123`, { method: "POST", body: formData });

	expect(result.ok).toBeTrue();
	expect(await result.text()).toBe("pixel.png");
});

it("GET /avatars/123/pixel.png exists", async () => {
	const result = await fetch(`${url}/avatars/123/pixel.png`, { method: "GET" });

	expect(result.ok).toBeTrue();

	const fileData = await Bun.file(path.resolve(__dirname, "pixel.png")).arrayBuffer();
	const requestData = await result.arrayBuffer();

	expect(Buffer.from(fileData, 0).equals(Buffer.from(requestData, 0))).toBeTrue();
});

it("GET /avatars/123/pixel.jpeg exists", async () => {
	const results = await Promise.all([
		fetch(`${url}/avatars/123/pixel.jpeg`, { method: "GET" }),
		fetch(`${url}/avatars/123/pixel.jpg`, { method: "GET" }),
		fetch(`${url}/avatars/123/pixel.webp`, { method: "GET" }),
	]);

	expect(results.every((x) => x.ok)).toBeTrue();

	for (const format of ["jpeg", "jpg", "webp"]) {
		const file = Bun.file(path.resolve(UPLOADS_DIR, `avatars/pixel.${format}`));
		expect(await file.exists()).toBeTrue();
	}
});

it("GET /avatars/123/invalid.png does not exist", async () => {
	const result = await fetch(`${url}/avatars/123/invalid.png`, { method: "GET" });
	const json = (await result.json()) as HuginnErrorFieldInformation;

	expect(json.message.toLowerCase()).toContain("file not found");
});

it("GET /avatars/123/pixel.gif to be invalid format", async () => {
	const result = await fetch(`${url}/avatars/123/pixel.gif`, { method: "GET" });
	const json = (await result.json()) as HuginnErrorFieldInformation;

	expect(json).toBeDefined();
	expect(json.message.toLowerCase()).toContain("invalid file format");
});
