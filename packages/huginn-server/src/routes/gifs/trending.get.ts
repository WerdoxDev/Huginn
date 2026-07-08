import type { APIGetTrendingGifsResult } from "@huginn/shared";

import { verifyJwt } from "@huginn/backend-shared";
import Elysia, { t } from "elysia";

import { fetchTrendingGifs, filterGifs } from "#utils/klipy";

const schema = t.Object({
   limit: t.Optional(t.Number()),
   page: t.Optional(t.Number()),
});

export const getTrendingGifs = new Elysia().use(verifyJwt()).get(
   "/api/gifs/trending",
   async ({ status, tokenPayload: { id }, query: { limit, page } }) => {
      const gifs = await fetchTrendingGifs(id, limit, page);

      const trending = filterGifs(gifs.data, { quality: "sm", format: "webm" });

      const json: APIGetTrendingGifsResult = trending;
      return status("OK", json);
   },
   { query: schema },
);
