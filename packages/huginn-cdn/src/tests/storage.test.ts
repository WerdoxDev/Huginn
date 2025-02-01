import { describe, expect, test } from "bun:test";
import pathe from "pathe";
import { FileStorage } from "#storage/file-storage";
import { S3Storage } from "#storage/s3-storage";

const storages = [new FileStorage(), new S3Storage()];

for (const storage of storages) {
	describe(`${storage.name} storage operations`, () => {
		test("should return true when writing is successful", async () => {
			const result = await storage.writeFile("avatars", "storage-test", "pixel.png", Bun.file(pathe.join(__dirname, "pixel.png")).stream());
			expect(result).toBeTrue();
		});

		test("should return an ArrayBuffer of a file when it is successful", async () => {
			const result = await storage.getFile("avatars", "storage-test", "pixel.png");
			expect(result).toBeDefined();
		});

		test("should return true when a file exists", async () => {
			const result = await storage.exists("avatars", "storage-test", "pixel.png");
			expect(result).toBeTrue();
		});
	});
}
