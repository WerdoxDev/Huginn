import type { APIGetGifCategoriesResult } from "@huginn/shared";

import { verifyJwt } from "@huginn/backend-shared";
import Elysia from "elysia";

import { fetchGifCategories, fetchTrendingGifs, filterGifs } from "#utils/klipy";

export const getGifCategories = new Elysia().use(verifyJwt()).get("/api/gifs/categories", async ({ status, tokenPayload: { id } }) => {
   const categories = await fetchGifCategories();
   const gifs = await fetchTrendingGifs(id);

   const trending = filterGifs(gifs.data, { quality: "sm", format: "webm" });

   const json: APIGetGifCategoriesResult = {
      categories: categories.data.categories.map((x) => ({ name: x.category, src: x.preview_url })),
      trendingGif: trending[0],
   };
   return status("OK", json);
});
