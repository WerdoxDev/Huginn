import consola from "consola";

const connectionString = process.env.POSTGRESQL_URL;
export const cdnRoot = process.env.CDN_ROOT;
export const serverHost = process.env.SERVER_HOST;
export const serverPort = process.env.SERVER_PORT;
export const certFile = process.env.CERTIFICATE_PATH && Bun.file(process.env.CERTIFICATE_PATH);
export const keyFile = process.env.PRIVATE_KEY_PATH && Bun.file(process.env.PRIVATE_KEY_PATH);

if (!connectionString) {
   consola.error("Database config is not set correctly!");
   process.exit();
}

// if (!serverHost || !serverPort) {
//    consola.error("Server config is not set correctly!");
//    process.exit();
// }
