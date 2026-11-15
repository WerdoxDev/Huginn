import { Routes, type APIExpression, type APIGetStickerCategoriesResult } from "@huginnjs/shared";

import type { CDN } from "../cdn";
import type { REST } from "../rest";

import { ExpressionAPI } from "./expression";

export class StickerAPI extends ExpressionAPI {
   constructor(rest: REST, cdn: CDN) {
      super(rest, cdn, "stickers");
   }

   public async getCategories(): Promise<APIGetStickerCategoriesResult> {
      return this.rest.get(Routes.stickerCategories(), { auth: true }) as Promise<APIGetStickerCategoriesResult>;
   }

   public async getTrending(limit = 24, page = 1): Promise<APIExpression[]> {
      return this.rest.get(Routes.trendingStickers(), { auth: true, query: new URLSearchParams({ limit: String(limit), page: String(page) }) }) as Promise<
         APIExpression[]
      >;
   }

   public async search(query: string, limit = 24, page = 1): Promise<APIExpression[]> {
      return this.rest.get(Routes.searchStickers(), { auth: true, query: new URLSearchParams({ query, limit: String(limit), page: String(page) }) }) as Promise<
         APIExpression[]
      >;
   }
}
