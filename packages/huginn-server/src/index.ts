// import { startListening } from "./commands";
import { startServer } from "./server";

// const certFile = env.CERTIFICATE_PATH && Bun.file(env.CERTIFICATE_PATH);
// const keyFile = env.PRIVATE_KEY_PATH && Bun.file(env.PRIVATE_KEY_PATH);

// await startListening();

const server = startServer();

// const app = new Hono();

// app.get("/", c => {
//    return c.json({
//       message: "Hello Hono!",
//    });
// });

export default server;
