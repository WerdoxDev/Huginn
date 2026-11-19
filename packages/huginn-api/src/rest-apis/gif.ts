import { Routes, type APIGetGifCategoriesResult, type APIGetSearchGifsResult, type APIGetTrendingGifsResult } from "@huginnjs/shared";

import type { REST } from "../rest";

import { CDN } from "../cdn";
import { ExpressionAPI } from "./expression";

export class GifAPI extends ExpressionAPI {
   constructor(rest: REST, cdn: CDN = new CDN()) {
      super(rest, cdn, "gifs");
   }

   public async getCategories(): Promise<APIGetGifCategoriesResult> {
      return this.rest.get(Routes.gifCategories(), { auth: true }) as Promise<APIGetGifCategoriesResult>;
   }

   public async getTrending(limit?: number, page?: number): Promise<APIGetTrendingGifsResult> {
      return this.rest.get(Routes.trendingGifs(), {
         auth: true,
         query: new URLSearchParams({
            ...(limit && { limit: limit.toString() }),
            ...(page && { page: page.toString() }),
         }),
      }) as Promise<APIGetTrendingGifsResult>;
   }

   public async search(query: string, limit?: number, page?: number): Promise<APIGetSearchGifsResult> {
      return this.rest.get(Routes.searchGifs(), {
         auth: true,
         query: new URLSearchParams({
            query,
            ...(limit && { limit: limit.toString() }),
            ...(page && { page: page.toString() }),
         }),
      }) as Promise<APIGetSearchGifsResult>;
   }
}
