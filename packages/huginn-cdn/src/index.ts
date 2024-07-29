import { Hono } from "hono";

const app = new Hono();

app.post("/avatars", async c => {
   const body = await c.req.parseBody();
   if ("file" in body && body.file instanceof File) {
      const hasher = new Bun.CryptoHasher("md5");
      hasher.update(body.file.name, "hex");
      const filename = hasher.digest("hex");
      console.log(body.file.type);
      await Bun.write(`./uploads/${filename}.png`, body.file);
   }
});

export const serverHost = process.env.SERVER_HOST;
export const serverPort = process.env.SERVER_PORT;
export const certFile = process.env.CERTIFICATE_PATH && Bun.file(process.env.CERTIFICATE_PATH);
export const keyFile = process.env.PRIVATE_KEY_PATH && Bun.file(process.env.PRIVATE_KEY_PATH);

export const server = Bun.serve<string>({
   cert: certFile,
   key: keyFile,
   port: serverPort,
   hostname: serverHost,
   fetch: app.fetch,
});
