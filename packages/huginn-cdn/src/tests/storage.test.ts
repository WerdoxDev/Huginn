import { expect, test } from "bun:test";
import path from "node:path";
import { FileStorage } from "#storage/file-storage";
import { S3Storage } from "#storage/s3-storage";

test("File Storage write is OK", async () => {
	const storage = new FileStorage();

	const result = await storage.writeFile("avatars", "test", "pixel.png", await Bun.file(path.join(__dirname, "pixel.png")).arrayBuffer());
	expect(result).toBeTrue();
});

test("File Storage get is OK", async () => {
	const storage = new FileStorage();

	const result = storage.getFile("avatars", "test", "pixel.png");
	expect(result).toBeDefined();
});

test("File Storage exist is OK", async () => {
	const storage = new FileStorage();

	const result = await storage.exists("avatars", "test", "pixel.png");
	expect(result).toBeTrue();
});

test("S3 Storage write is OK", async () => {
	const storage = new S3Storage();

	const result = await storage.writeFile("avatars", "test", "pixel.png", await Bun.file(path.join(__dirname, "pixel.png")).arrayBuffer());
	expect(result).toBeTrue();
});

test("S3 Storage exist is OK", async () => {
	const storage = new S3Storage();

	const result = await storage.exists("avatars", "test", "pixel.png");
	expect(result).toBeTrue();
});

test("S3 Storage get is OK", async () => {
	const storage = new S3Storage();

	const result = await storage.getFile("avatars", "test", "pixel.png");
	expect(result).toBeDefined();
});
