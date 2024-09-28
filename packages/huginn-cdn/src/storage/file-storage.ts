import { logFileNotFound, logGetFile, logWriteFile } from "@huginn/backend-shared";
import pathe from "pathe";
import { UPLOADS_DIR } from "#setup";
import { Storage } from "#storage/storage";
import type { FileCategory } from "#types";

export class FileStorage extends Storage {
	public async getFile(category: FileCategory, name: string): Promise<ReadableStream | undefined> {
		try {
			const file = Bun.file(pathe.join(UPLOADS_DIR, category, name));

			if (!(await file.exists())) {
				logFileNotFound(category, name);
				return undefined;
			}

			logGetFile(category, name);
			return file.stream();
		} catch (e) {
			logFileNotFound(category, name);
			return undefined;
		}
	}

	public async writeFile(category: FileCategory, name: string, data: Blob | Uint8Array | string | ArrayBuffer): Promise<boolean> {
		logWriteFile(category, name);
		try {
			await Bun.write(pathe.join(UPLOADS_DIR, category, name), data);
			return true;
		} catch (e) {
			console.error(e);
			return false;
		}
	}

	public async exists(category: FileCategory, name: string): Promise<boolean> {
		try {
			return await Bun.file(pathe.join(UPLOADS_DIR, category, name)).exists();
		} catch (e) {
			logFileNotFound(category, name);
			return false;
		}
	}
}
