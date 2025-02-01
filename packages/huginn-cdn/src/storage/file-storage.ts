import { logFileNotFound, logGetFile, logWriteFile } from "@huginn/backend-shared";
import { join } from "pathe";
import { envs } from "#setup";
import { Storage } from "#storage/storage";
import type { FileCategory } from "#utils/types";

export class FileStorage extends Storage {
	public constructor() {
		super("local");
	}

	public async getFile(category: FileCategory, subDirectory: string, name: string): Promise<ReadableStream | undefined> {
		try {
			const file = Bun.file(join(envs.UPLOADS_DIR, category, subDirectory, name));

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

	public async writeFile(category: FileCategory, subDirectory: string, name: string, data: string | ReadableStream): Promise<boolean> {
		logWriteFile(category, name);
		try {
			await Bun.write(
				join(envs.UPLOADS_DIR, category, subDirectory, name),
				data instanceof ReadableStream ? await Bun.readableStreamToArrayBuffer(data) : data,
			);
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
			logFileNotFound(category, name);
			return false;
		}
	}
}
