import { verifyJwt } from "@huginn/backend-shared";
import Elysia, { t } from "elysia";

import { fetchStickers } from "#utils/klipy";

const pagination = { limit: t.Optional(t.Integer({ minimum: 1, maximum: 50 })), page: t.Optional(t.Integer({ minimum: 1, maximum: 10000 })) };

export const getSearchStickers = new Elysia()
   .use(verifyJwt())
   .get("/api/stickers/search", async ({ tokenPayload, query }) => fetchStickers(tokenPayload.id, query.query, query.limit, query.page), {
      query: t.Object({ ...pagination, limit: t.Optional(t.Integer({ minimum: 8, maximum: 50 })), query: t.String({ minLength: 1, maxLength: 200 }) }),
   });
