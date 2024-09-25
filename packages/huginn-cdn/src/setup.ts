import path from "node:path";
import consola from "consola";

export const cdnHost = process.env.CDN_HOST;
export const cdnPort = process.env.CDN_PORT;
export const certFile = process.env.CERTIFICATE_PATH && Bun.file(process.env.CERTIFICATE_PATH);
export const keyFile = process.env.PRIVATE_KEY_PATH && Bun.file(process.env.PRIVATE_KEY_PATH);

export const uploadsDir = path.resolve(import.meta.dir, "../uploads");

// if (!cdnHost || !cdnPort) {
//    consola.error("CDN config is not set correctly!");
//    process.exit();
// }
