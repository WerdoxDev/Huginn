import { storage } from "#setup";
import { extractFileInfo, transformImage } from "#utils/file-utils";
import { createRoute, invalidFileFormat, invalidFormBody, tryCatch, verifyJwt } from "@huginn/backend-shared";
import { HttpCode } from "@huginn/shared";
import { StreamingApi } from "hono/utils/stream";

createRoute("POST", "/cdn/application-icons/:applicationId?", verifyJwt("cdn"), async (c) => {
   const { applicationId } = c.req.param();
   const [error, body] = await tryCatch(async () => await c.req.formData());

   if (error) {
      return invalidFormBody(c);
   }

   const file = body.get("files[0]");

   if (!body || !file || !(file instanceof File)) {
      return invalidFileFormat(c);
   }

   const fileStream = file.stream();
   const { name } = extractFileInfo(file.name);
   console.log(file.name);

   const { readable, writable } = new TransformStream();
   const stream = new StreamingApi(writable, readable);

   await transformImage(fileStream, stream, "webp", undefined, 32, 32);

   await storage.writeFile("application-icons", applicationId ?? "", `${name}.webp`, stream.responseReadable);

   return c.text(name, HttpCode.CREATED);
});
