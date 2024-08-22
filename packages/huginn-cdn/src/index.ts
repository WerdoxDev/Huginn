import consola from "consola";
import { startCdn } from "./cdn";

export const cdnHost = process.env.CDN_HOST;
export const cdnPort = process.env.CDN_PORT;
export const certFile = process.env.CERTIFICATE_PATH && Bun.file(process.env.CERTIFICATE_PATH);
export const keyFile = process.env.PRIVATE_KEY_PATH && Bun.file(process.env.PRIVATE_KEY_PATH);

if (!cdnHost || !cdnPort) {
   consola.error("CDN config is not set correctly!");
   process.exit();
}

const { app, cdn: _cdn } = startCdn();

export { app };
