import { describe, expect, test } from "bun:test";
import path from "node:path";
import { testHandler } from "@huginn/backend-shared";
import { compareArrayBuffers } from "@huginn/shared";
import { envs } from "../setup";

const categories = ["avatars", "channel-icons"];

for (const category of categories) {
	describe(`${category} operations`, () => {
		test(`should return 'Invalid Form Body' when body constrains are not met`, async () => {
			const result = testHandler(`/${category}/123`, {}, "POST");

			expect(result).rejects.toThrow("Invalid Form Body");
		});

		test(`should return 'File Not Found' when a file with doesn't exist`, async () => {
			const result = testHandler(`/${category}/123/invalid.png`, {}, "GET");
			expect(result).rejects.toThrow("File Not Found");
		});

		test(`should return 'Invalid File Format' when the specified file format is invalid`, async () => {
			const result = testHandler(`${category}/123/pixel.gif`, {}, "GET");
			expect(result).rejects.toThrow("Invalid File Format");
		});

		test("should return the file name when file upload is successful", async () => {
			const formData = new FormData();
			formData.append("files[0]", Bun.file(path.resolve(__dirname, "pixel.png")), "pixel.png");

			const result = (await testHandler(`/${category}/123`, {}, "POST", formData, true)) as Response;
			expect(await result.text()).toBe("pixel.png");
		});

		test("should return an exact file when request is successful", async () => {
			const result = (await testHandler(`/${category}/123/pixel.png`, {}, "GET", undefined, true)) as Response;

			expect(result.ok).toBeTrue();

			const fileData = await Bun.file(path.resolve(__dirname, "pixel.png")).arrayBuffer();
			const requestData = await result.arrayBuffer();

			expect(compareArrayBuffers(fileData, requestData)).toBeTrue();
		});

		test(`should return an image in different formats even if they aren't cached / don't exist`, async () => {
			const results = (await Promise.all([
				testHandler(`/${category}/123/pixel.jpeg`, {}, "GET", undefined, true),
				testHandler(`/${category}/123/pixel.jpg`, {}, "GET", undefined, true),
				testHandler(`/${category}/123/pixel.webp`, {}, "GET", undefined, true),
			])) as [Response, Response, Response];

			expect(results.every((x) => x.ok)).toBeTrue();

			for (const format of ["jpeg", "jpg", "webp"]) {
				const file = Bun.file(path.resolve(envs.UPLOADS_DIR, `${category}/123/pixel.${format}`));
				expect(await file.exists()).toBeTrue();
			}
		});
	});
}
