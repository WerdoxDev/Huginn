import { afterAll, beforeAll } from "bun:test";
import { unlink } from "node:fs/promises";
import path from "node:path";
import { uploadsDir } from "../setup";

async function deleteTestFiles() {
	for (const format of ["png", "jpeg", "jpg", "webp"]) {
		const file = Bun.file(path.resolve(uploadsDir, `/avatars/pixel.${format}`));
		if (await file.exists()) {
			// biome-ignore lint/style/noNonNullAssertion: <explanation>
			await unlink(file.name!);
		}
	}
}

beforeAll(async () => {
	await deleteTestFiles();
});

afterAll(async () => {
	await deleteTestFiles();
});
