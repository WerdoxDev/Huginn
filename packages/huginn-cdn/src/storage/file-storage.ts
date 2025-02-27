import { logFileNotFound, logGetFile, logWriteFile } from "@huginn/backend-shared";
import { join } from "pathe";
import { Storage } from "#storage/storage";
import type { FileCategory } from "#utils/types";

export class FileStorage extends Storage {
	directory: string;

	public constructor(directory: string) {
		super("local");
		this.directory = directory;
	}

	public async getFile(category: FileCategory, subDirectory: string, name: string): Promise<ReadableStream | undefined> {
		try {
			const file = Bun.file(join(this.directory, category, ...subDirectory.split("/"), name));

			if (!(await file.exists())) {
				logFileNotFound(category, subDirectory, name);
				return undefined;
			}

			logGetFile(category, subDirectory, name);
			return file.stream();
		} catch (e) {
			logFileNotFound(category, subDirectory, name);
			return undefined;
		}
	}

	public async writeFile(category: FileCategory, subDirectory: string, name: string, data: ReadableStream): Promise<boolean> {
		logWriteFile(category, subDirectory, name);
		try {
			const file = Bun.file(join(this.directory, category, ...subDirectory.split("/"), name));
			await file.write(await Bun.readableStreamToArrayBuffer(data));
			return true;
		} catch (e) {
			console.error(this.name, "writeFile", e);
			return false;
		}
	}

	public async exists(category: FileCategory, subDirectory: string, name: string): Promise<boolean> {
		try {
			return await Bun.file(join(this.directory, category, ...subDirectory.split("/"), name)).exists();
		} catch (e) {
			logFileNotFound(category, subDirectory, name);
			return false;
		}
	}

	public async stat(category: FileCategory, subDirectory: string, name: string): Promise<unknown> {
		try {
			const stat = await Bun.file(join(this.directory, category, ...subDirectory.split("/"), name)).stat();
			return stat;
		} catch (e) {
			logFileNotFound(category, subDirectory, name);
			return undefined;
		}
	}
}
