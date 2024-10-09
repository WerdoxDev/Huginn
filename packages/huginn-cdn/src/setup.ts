import path from "node:path";

export const CDN_HOST = process.env.CDN_HOST;
export const CDN_PORT = process.env.CDN_PORT;
export const CERT_FILE = process.env.CERTIFICATE_PATH && Bun.file(process.env.CERTIFICATE_PATH);
export const KEY_FILE = process.env.PRIVATE_KEY_PATH && Bun.file(process.env.PRIVATE_KEY_PATH);

export const AWS_REGION = process.env.AWS_REGION;
export const AWS_KEY_ID = process.env.AWS_KEY_ID;
export const AWS_SECRET_KEY = process.env.AWS_SECRET_KEY;
export const AWS_BUCKET = process.env.AWS_BUCKET;

export const UPLOADS_DIR = path.resolve(import.meta.dir, "../uploads");
