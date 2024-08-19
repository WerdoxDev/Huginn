import { HttpCode } from "@huginn/shared";
import { Hono } from "hono";
import { handleRequest } from "./route-utils";
import { extractFileInfo, findImageByName, transformImage } from "./utils";
import path from "path";

const app = new Hono();

app.post("/avatars/:userId", c =>
   handleRequest(c, async () => {
      const body = await c.req.parseBody();

      if (!("files[0]" in body) || !(body["files[0]"] instanceof File)) {
         return c.text("Provided data was not correct", HttpCode.BAD_REQUEST);
      }

      const file = body["files[0]"];
      await Bun.write(`./uploads/avatars/${file.name}`, file);

      return c.newResponse(file.name, HttpCode.CREATED);
   }),
);

app.get("/avatars/:userId/:avatarHash{.+(.png|.jpeg|.jpg|.webp|.gif)$}", c =>
   handleRequest(c, async () => {
      const avatashHash = c.req.param("avatarHash");
      const { name, format, mimeType } = extractFileInfo(avatashHash);

      // Best scenario, file already exists and ready to serve
      const file = Bun.file(path.join(__dirname, `../uploads/avatars/${name}.${format}`));

      if (await file.exists()) {
         return c.body(await file.arrayBuffer(), HttpCode.OK, { "Content-Type": mimeType });
      }

      // File doesn't exist so we have to see if another format exists
      const { file: otherFile } = await findImageByName("../uploads/avatars", name);

      const result = await transformImage(otherFile, format, 100);
      await Bun.write(path.join(__dirname, `../uploads/avatars/${avatashHash}`), result);

      return c.body(result, HttpCode.OK, { "Content-Type": mimeType });
   }),
);

export default app;
