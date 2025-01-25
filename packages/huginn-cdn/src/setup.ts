import { readEnv } from "@huginn/backend-shared";
import pathe from "pathe";
import { FileStorage } from "#storage/file-storage";
import { S3Storage } from "#storage/s3-storage";
import type { Storage } from "#storage/storage";

export const envs = readEnv([
	"CDN_HOST",
	"CDN_PORT",
	"CERTIFICATE_PATH",
	"PRIVATE_KEY_PATH",
	"PASSPHRASE",
	"AWS_REGION",
	"AWS_KEY_ID",
	"AWS_SECRET_KEY",
	"AWS_BUCKET",
	{ key: "UPLOADS_DIR", default: pathe.resolve(import.meta.dir, "../uploads") },
] as const);

export const CERT_FILE = envs.CERTIFICATE_PATH && Bun.file(envs.CERTIFICATE_PATH);
export const KEY_FILE = envs.PRIVATE_KEY_PATH && Bun.file(envs.PRIVATE_KEY_PATH);

export const AWS_AVAILABLE = !!envs.AWS_SECRET_KEY && !!envs.AWS_KEY_ID && !!envs.AWS_BUCKET && !!envs.AWS_REGION;
export const storage: Storage = AWS_AVAILABLE ? new S3Storage() : new FileStorage();
