import { serverError, verifyJwt } from "@huginn/backend-shared";
import Elysia, { t } from "elysia";

import { storage } from "#server";
import { prepareStickerImage } from "#utils/route-utils";

const bodySchema = t.Object({ files: t.Array(t.File(), { minItems: 1, maxItems: 1 }) });
const paramsSchema = t.Object({ id: t.String({ pattern: "^[0-9]{1,20}$" }) });

export const postSticker = new Elysia().use(verifyJwt("cdn")).post(
   "/cdn/stickers/:id",
   async ({ body, params: { id }, status }) => {
      const image = await prepareStickerImage(body.files[0], status);
      if (!("file" in image)) return image;
      const filename = `${id}.webp`;
      if (!(await storage.writeFile("stickers", "", filename, image.file))) return serverError(status);
      return status("Created", { asset: `stickers/${filename}`, width: image.width, height: image.height });
   },
   {
      body: bodySchema,
      params: paramsSchema,
   },
);
