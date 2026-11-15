import { serverError, singleError, verifyJwt } from "@huginn/backend-shared";
import { CONSTANTS, Errors } from "@huginnjs/shared";
import Elysia, { t } from "elysia";
import sharp from "sharp";

import { storage } from "#server";

const bodySchema = t.Object({ files: t.Array(t.File(), { minItems: 1, maxItems: 1 }) });
const paramsSchema = t.Object({ id: t.String({ pattern: "^[0-9]{1,20}$" }) });

export const postSticker = new Elysia().use(verifyJwt("cdn")).post(
   "/cdn/stickers/:id",
   async ({ body, params: { id }, status }) => {
      const input = body.files[0];
      if (!input.size) return singleError(Errors.invalidFileFormat(), status, "Bad Request");

      let width;
      let height;
      let file;
      try {
         const image = sharp(Buffer.from(await input.arrayBuffer()), { animated: true, limitInputPixels: 40_000_000 });
         const metadata = await image.metadata();
         if (!metadata.format || !CONSTANTS.ALLOWED_STICKER_FORMATS.includes(metadata.format as any)) {
            return singleError(Errors.invalidFileFormat(), status, "Bad Request");
         }
         const frames = metadata.pages ?? 1;
         const oldHeight = metadata.pageHeight ?? metadata.height ?? 0;
         if (!metadata.width || !oldHeight || metadata.width * oldHeight * frames > 40_000_000 || frames > 300) {
            return singleError(Errors.invalidFileFormat(), status, "Bad Request");
         }

         const { data, info } = await image
            .rotate()
            .resize({ width: 512, height: 512, fit: "inside", withoutEnlargement: true })
            .webp({ quality: 85, effort: 3 })
            .toBuffer({ resolveWithObject: true });

         width = info.width;
         height = info.pageHeight ?? info.height;
         file = new Blob([new Uint8Array(data)], { type: "image/webp" });
      } catch {
         return singleError(Errors.invalidFileFormat(), status, "Bad Request");
      }

      const filename = `${id}.webp`;
      if (!(await storage.writeFile("stickers", "", filename, file))) return serverError(status);
      return status("Created", { asset: `stickers/${filename}`, width: width, height: height });
   },
   {
      body: bodySchema,
      params: paramsSchema,
   },
);
