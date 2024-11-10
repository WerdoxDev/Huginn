import { GetObjectCommand, HeadObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { logFileNotFound, logGetFile, logWriteFile } from "@huginn/backend-shared";
import pathe from "pathe";
import { envs } from "#setup";
import { Storage } from "#storage/storage";
import type { FileCategory } from "#types";

export class S3Storage extends Storage {
	private s3: S3Client;

	public constructor() {
		super("s3");

		this.s3 = new S3Client({
			region: envs.AWS_REGION,
			credentials: { accessKeyId: envs.AWS_KEY_ID ?? "", secretAccessKey: envs.AWS_SECRET_KEY ?? "" },
		});
	}

	public async getFile(category: FileCategory, subDirectory: string, name: string): Promise<ArrayBuffer | undefined> {
		try {
			const cmd = new GetObjectCommand({ Bucket: envs.AWS_BUCKET, Key: pathe.join(category, subDirectory, name) });
			const result = await this.s3.send(cmd);

			logGetFile(category, name);
			return (await result.Body?.transformToByteArray())?.buffer as ArrayBuffer;
		} catch (e) {
			logFileNotFound(category, name);
			return undefined;
		}
	}

	public async writeFile(category: FileCategory, subDirectory: string, name: string, data: string | ArrayBuffer): Promise<boolean> {
		logWriteFile(category, name);
		try {
			const cmd = new PutObjectCommand({
				Bucket: envs.AWS_BUCKET,
				Key: pathe.join(category, subDirectory, name),
				Body: data instanceof ArrayBuffer ? new Uint8Array(data) : data,
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
			const cmd = new HeadObjectCommand({ Bucket: envs.AWS_BUCKET, Key: pathe.join(category, subDirectory, name) });
			const result = await this.s3.send(cmd);
			return true;
		} catch (e) {
			logFileNotFound(category, name);
			return false;
		}
	}
}
