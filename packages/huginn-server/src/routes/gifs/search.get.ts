import type { APIGetSearchGifsResult } from "@huginnjs/shared";

import { verifyJwt } from "@huginn/backend-shared";
import Elysia, { t } from "elysia";

import { fetchSearchGifs, filterGifs } from "#utils/klipy";

const schema = t.Object({
   query: t.String(),
   limit: t.Optional(t.Number()),
   page: t.Optional(t.Number()),
});

export const getSearchGifs = new Elysia()
   .use(verifyJwt())
   .get("/api/gifs/search", { query: schema }, async ({ status, tokenPayload: { id }, query: { query, limit, page } }) => {
      const gifs = await fetchSearchGifs(id, query, limit, page);
      const filteredGifs = filterGifs(gifs.data, { quality: "sm", format: "webm" });

      const json: APIGetSearchGifsResult = filteredGifs;
      return status("OK", json);
   });
