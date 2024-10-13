import { GetObjectCommand, HeadObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { logFileNotFound, logGetFile, logWriteFile } from "@huginn/backend-shared";
import consola from "consola";
import pathe from "pathe";
import { AWS_BUCKET, AWS_KEY_ID, AWS_REGION, AWS_SECRET_KEY } from "#setup";
import { Storage } from "#storage/storage";
import type { FileCategory } from "#types";

export class S3Storage extends Storage {
	private s3: S3Client;
	public constructor() {
		super();

		this.s3 = new S3Client({
			region: AWS_REGION,
			credentials: { accessKeyId: AWS_KEY_ID ?? "", secretAccessKey: AWS_SECRET_KEY ?? "" },
		});
	}

	public async getFile(category: FileCategory, subDirectory: string, name: string): Promise<ReadableStream | undefined> {
		try {
			consola.log(pathe.join(category, name), "PATH");
			const cmd = new GetObjectCommand({ Bucket: AWS_BUCKET, Key: pathe.join(category, subDirectory, name) });
			const result = await this.s3.send(cmd);

			logGetFile(category, name);
			return result.Body?.transformToWebStream();
		} catch (e) {
			logFileNotFound(category, name);
			return undefined;
		}
	}

	public async writeFile(
		category: FileCategory,
		subDirectory: string,
		name: string,
		data: Blob | Uint8Array | string | ArrayBuffer,
	): Promise<boolean> {
		logWriteFile(category, name);
		try {
			const cmd = new PutObjectCommand({
				Bucket: AWS_BUCKET,
				Key: pathe.join(category, subDirectory, name),
				Body: data instanceof ArrayBuffer ? Buffer.from(data) : data,
			});
			const result = await this.s3.send(cmd);
			return true;
		} catch (e) {
			console.error(e);
			return false;
		}
	}

	public async exists(category: FileCategory, subDirectory: string, name: string): Promise<boolean> {
		try {
			const cmd = new HeadObjectCommand({ Bucket: AWS_BUCKET, Key: pathe.join(category, subDirectory, name) });
			const result = await this.s3.send(cmd);
			return true;
		} catch (e) {
			logFileNotFound(category, name);
			return false;
		}
	}
}
