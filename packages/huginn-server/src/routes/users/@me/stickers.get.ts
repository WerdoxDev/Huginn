import { verifyJwt } from "@huginn/backend-shared";
import { prisma } from "@huginn/backend-shared/database";
import Elysia, { t } from "elysia";

import { customStickerToAPI } from "#utils/stickers";

const pagination = { limit: t.Optional(t.Integer({ minimum: 1, maximum: 50 })), page: t.Optional(t.Integer({ minimum: 1, maximum: 10000 })) };

export const getUserStickers = new Elysia().use(verifyJwt()).get(
   "/api/users/@me/stickers",
   async ({ tokenPayload, query: { query, limit = 24, page = 1 } }) => {
      const stickers = await prisma.sticker.findMany({
         where: { userId: BigInt(tokenPayload.id), ...(query ? { title: { contains: query, mode: "insensitive" } } : {}) },
         orderBy: { id: "desc" },
         take: limit,
         skip: (page - 1) * limit,
      });
      return stickers.map(customStickerToAPI);
   },
   { query: t.Object({ ...pagination, query: t.Optional(t.String({ maxLength: 200 })) }) },
);
