import type { APIGetStickerCategoriesResult } from "@huginnjs/shared";

import { verifyJwt } from "@huginn/backend-shared";
import Elysia from "elysia";

import { fetchStickerCategories, fetchStickers } from "#utils/klipy";

export const getStickerCategories = new Elysia()
   .use(verifyJwt())
   .get("/api/stickers/categories", async ({ tokenPayload }): Promise<APIGetStickerCategoriesResult> => {
      const [categories, trending] = await Promise.all([fetchStickerCategories(), fetchStickers(tokenPayload.id)]);
      return { categories, trendingSticker: trending[0] };
   });
