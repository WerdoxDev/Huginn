import { serverError, singleError, verifyJwt } from "@huginn/backend-shared";
import { Errors } from "@huginnjs/shared";
import Elysia, { t } from "elysia";
import sharp from "sharp";

import { storage } from "#server";

const bodySchema = t.Object({ files: t.Array(t.File(), { minItems: 1, maxItems: 1 }) });
const paramsSchema = t.Object({ id: t.String({ pattern: "^[0-9]{1,20}$" }) });

export const postGif = new Elysia().use(verifyJwt("cdn")).post(
   "/cdn/gifs/:id",
   async ({ body, params: { id }, status }) => {
      const input = body.files[0];
      if (!input.size) return singleError(Errors.invalidFileFormat(), status, "Bad Request");

      let width: number;
      let height: number;
      const bytes = new Uint8Array(await input.arrayBuffer());
      try {
         const image = sharp(bytes, { animated: true, limitInputPixels: 100_000_000 });
         const metadata = await image.metadata();
         width = metadata.width ?? 0;
         height = metadata.pageHeight ?? metadata.height ?? 0;
         if (metadata.format !== "gif" || !width || !height || width * height * (metadata.pages ?? 1) > 100_000_000)
            return singleError(Errors.invalidFileFormat(), status, "Bad Request");
         // Decode every frame to reject corrupt uploads while retaining the original GIF bytes.
         await image.stats();
      } catch {
         return singleError(Errors.invalidFileFormat(), status, "Bad Request");
      }

      const filename = `${id}.gif`;
      if (!(await storage.writeFile("gifs", "", filename, new Blob([bytes], { type: "image/gif" })))) return serverError(status);
      return status("Created", { asset: `gifs/${filename}`, width, height });
   },
   {
      body: bodySchema,
      params: paramsSchema,
   },
);
