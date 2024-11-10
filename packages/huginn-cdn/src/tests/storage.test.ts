import { expect, test } from "bun:test";
import pathe from "pathe";
import { FileStorage } from "#storage/file-storage";
import { S3Storage } from "#storage/s3-storage";

const storages = [new FileStorage(), new S3Storage()];

for (const storage of storages) {
	test(`${storage.name} storage write is OK`, async () => {
		const result = await storage.writeFile(
			"avatars",
			"storage-test",
			"pixel.png",
			await Bun.file(pathe.join(__dirname, "pixel.png")).arrayBuffer(),
		);
		expect(result).toBeTrue();
	});

	test(`${storage.name} storage get is OK`, async () => {
		const result = await storage.getFile("avatars", "storage-test", "pixel.png");
		expect(result).toBeDefined();
	});

	test(`${storage.name} storage exist is OK`, async () => {
		const result = await storage.exists("avatars", "storage-test", "pixel.png");
		expect(result).toBeTrue();
	});
}
