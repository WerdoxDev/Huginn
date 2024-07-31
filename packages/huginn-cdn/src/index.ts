import { HttpCode } from "@huginn/shared";
import { Hono } from "hono";

const app = new Hono();

app.post("/avatars/:userId", async c => {
   const body = await c.req.parseBody();

   if (!("files[0]" in body) || !(body["files[0]"] instanceof File)) {
      return c.text("Provided data was not correct", HttpCode.BAD_REQUEST);
   }

   const file = body["files[0]"];

   const type = file.type.split("/")[1];
   await Bun.write(`./uploads/avatars/${file.name}.${type}`, file);

   return c.newResponse(null, HttpCode.CREATED);
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
