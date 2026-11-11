import { singleError, verifyJwt } from "@huginn/backend-shared";
import { prisma } from "@huginn/backend-shared/database";
import { CDNRoutes, CONSTANTS, Errors, HuginnAPIError, snowflake, WorkerID } from "@huginnjs/shared";
import Elysia, { t } from "elysia";

import { cdnUpload } from "#utils/server-request";
import { customStickerToAPI } from "#utils/stickers";

export const postSticker = new Elysia().use(verifyJwt()).post(
   "/api/stickers",
   async ({ tokenPayload, body, status }) => {
      const file = body.files[0];
      if (!file || !file.size) return singleError(Errors.invalidFileFormat(), status, "Bad Request");
      if (file.size > CONSTANTS.STICKER_MAX_BYTES) return singleError(Errors.fileTooLarge(file.size, CONSTANTS.STICKER_MAX_BYTES), status, "Bad Request");
      const id = snowflake.generate(WorkerID.STICKER);
      let uploaded: { asset: string; width: number; height: number };
      try {
         uploaded = await cdnUpload(CDNRoutes.uploadSticker(id.toString()), {
            files: [{ data: await file.arrayBuffer(), name: file.name }],
         });
      } catch (error) {
         if (error instanceof HuginnAPIError && error.status === 400) return status("Bad Request", error.rawError);
         throw error;
      }
      const title =
         body.title?.trim() ||
         file.name
            .replace(/\.[^.]+$/, "")
            .trim()
            .slice(0, 100) ||
         "Sticker";
      const sticker = await prisma.sticker.create({
         data: { id, userId: BigInt(tokenPayload.id), title, ...uploaded },
      });
      return status("Created", customStickerToAPI(sticker));
   },
   {
      body: t.Object({
         title: t.Optional(t.String({ maxLength: 100 })),
         files: t.Array(t.File(), { minItems: 1, maxItems: 1 }),
      }),
   },
);
