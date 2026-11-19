import { verifyJwt } from "@huginn/backend-shared";
import Elysia, { t } from "elysia";

import { fetchStickers } from "#utils/klipy";

const pagination = { limit: t.Optional(t.Integer({ minimum: 1, maximum: 50 })), page: t.Optional(t.Integer({ minimum: 1, maximum: 10000 })) };

export const getTrendingStickers = new Elysia()
   .use(verifyJwt())
   .get("/api/stickers/trending", async ({ tokenPayload, query }) => fetchStickers(tokenPayload.id, undefined, query.limit, query.page), {
      query: t.Object(pagination),
   });
