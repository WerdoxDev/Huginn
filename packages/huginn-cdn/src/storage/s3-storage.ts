import { logFileNotFound, logGetFile, logWriteFile } from "@huginn/backend-shared";
import { S3Client, type S3Stats } from "bun";
import { join } from "pathe";
import { envs } from "#setup";
import { Storage } from "#storage/storage";
import type { FileCategory } from "#utils/types";

export class S3Storage extends Storage {
	private s3: S3Client;

	public constructor() {
		super("s3");

		this.s3 = new S3Client({
			region: envs.AWS_REGION,
			accessKeyId: envs.AWS_KEY_ID,
			secretAccessKey: envs.AWS_SECRET_KEY,
			bucket: envs.AWS_BUCKET,
		});
	}

	public async getFile(
		category: FileCategory,
		subDirectory: string,
		name: string,
		start?: number,
		end?: number,
	): Promise<ReadableStream | undefined> {
		try {
			let file = this.s3.file(join(category, ...subDirectory.split("/"), name), { partSize: 5 * 1024 * 1024 });
			if (start || end) {
				file = file.slice(start, end);
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
			const file = this.s3.file(join(category, ...subDirectory.split("/"), name));
			const result = await file.write(new Response(data));
			return true;
		} catch (e) {
			console.error(this.name, "writeFile", e);
			return false;
		}
	}

	public async exists(category: FileCategory, subDirectory: string, name: string): Promise<boolean> {
		try {
			const exists = await this.s3.exists(join(category, ...subDirectory.split("/"), name));
			return exists;
		} catch (e) {
			logFileNotFound(category, subDirectory, name);
			return false;
		}
	}

	public async stat(category: FileCategory, subDirectory: string, name: string): Promise<S3Stats | undefined> {
		try {
			const stat = await this.s3.stat(join(category, ...subDirectory.split("/"), name));
			return stat;
		} catch (e) {
			logFileNotFound(category, subDirectory, name);
			return undefined;
		}
	}
}
