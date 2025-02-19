import { logFileNotFound, logGetFile, logWriteFile } from "@huginn/backend-shared";
import { join } from "pathe";
import { envs } from "#setup";
import { Storage } from "#storage/storage";
import type { FileCategory } from "#utils/types";

export class FileStorage extends Storage {
	public constructor() {
		super("local");
	}

	public async getFile(category: FileCategory, subDirectory: string, name: string): Promise<ArrayBuffer | undefined> {
		try {
			const file = Bun.file(join(envs.UPLOADS_DIR, category, ...subDirectory.split("/"), name));

			if (!(await file.exists())) {
				logFileNotFound(category, subDirectory, name);
				return undefined;
			}

			logGetFile(category, subDirectory, name);
			return await file.arrayBuffer();
		} catch (e) {
			logFileNotFound(category, subDirectory, name);
			return undefined;
		}
	}

	public async writeFile(category: FileCategory, subDirectory: string, name: string, data: string | ArrayBuffer): Promise<boolean> {
		logWriteFile(category, subDirectory, name);
		try {
			await Bun.write(join(envs.UPLOADS_DIR, category, subDirectory, name), data);
			return true;
		} catch (e) {
			console.error(this.name, "writeFile", e);
			return false;
		}
	}

	public async exists(category: FileCategory, subDirectory: string, name: string): Promise<boolean> {
		try {
			return await Bun.file(join(envs.UPLOADS_DIR, category, subDirectory, name)).exists();
		} catch (e) {
			logFileNotFound(category, subDirectory, name);
			return false;
		}
	}
}
