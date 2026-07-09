import { Routes, type APIGetGifCategoriesResult, type APIGetSearchGifsResult, type APIGetTrendingGifsResult } from "@huginn/shared";

import type { REST } from "../rest";

export class GifAPI {
   private readonly rest: REST;

   public constructor(rest: REST) {
      this.rest = rest;
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
