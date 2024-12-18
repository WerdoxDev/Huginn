import { describe, expect, test } from "bun:test";
import path from "node:path";
import { type HuginnErrorFieldInformation, compareArrayBuffers } from "@huginn/shared";
import { startCdn } from "#cdn";
import { envs } from "../setup";

const url = `http://${envs.CDN_HOST}:${envs.CDN_PORT}`;

const categories = ["avatars", "channel-icons"];

//TODO: Make sure of PlainHandler instead of fetch
await startCdn({ serve: true, defineOptions: true, storage: "local" });
for (const category of categories) {
	test(`POST /${category}/123 empty to be not ok`, async () => {
		const result = await fetch(`${url}/${category}/123`, { method: "POST" });

		expect(result.status).not.toBe(500);
	});

	test(`POST /${category}/123 is ok`, async () => {
		const formData = new FormData();
		formData.append("files[0]", Bun.file(path.resolve(__dirname, "pixel.png")), "pixel.png");

		const result = await fetch(`${url}/${category}/123`, { method: "POST", body: formData });

		expect(result.ok).toBeTrue();
		expect(await result.text()).toBe("pixel.png");
	});

	test(`GET /${category}/123/pixel.png exists`, async () => {
		const result = await fetch(`${url}/${category}/123/pixel.png`, { method: "GET" });

		expect(result.ok).toBeTrue();

		const fileData = await Bun.file(path.resolve(__dirname, "pixel.png")).arrayBuffer();
		const requestData = await result.arrayBuffer();

		expect(compareArrayBuffers(fileData, requestData)).toBeTrue();
	});

	test(`GET /${category}/123/pixel.{jpef,jpg,webp} exists`, async () => {
		const results = await Promise.all([
			fetch(`${url}/${category}/123/pixel.jpeg`, { method: "GET" }),
			fetch(`${url}/${category}/123/pixel.jpg`, { method: "GET" }),
			fetch(`${url}/${category}/123/pixel.webp`, { method: "GET" }),
		]);

		expect(results.every((x) => x.ok)).toBeTrue();

		for (const format of ["jpeg", "jpg", "webp"]) {
			const file = Bun.file(path.resolve(envs.UPLOADS_DIR, `${category}/123/pixel.${format}`));
			expect(await file.exists()).toBeTrue();
		}
	});

	test(`GET /${category}/123/invalid.png does not exist`, async () => {
		const result = await fetch(`${url}/${category}/123/invalid.png`, { method: "GET" });
		const json = (await result.json()) as HuginnErrorFieldInformation;

		expect(json.message.toLowerCase()).toContain("file not found");
	});

	test(`GET /${category}/123/pixel.gif to be invalid format`, async () => {
		const result = await fetch(`${url}/${category}/123/pixel.gif`, { method: "GET" });
		const json = (await result.json()) as HuginnErrorFieldInformation;

		expect(json).toBeDefined();
		expect(json.message.toLowerCase()).toContain("invalid file format");
	});
}
