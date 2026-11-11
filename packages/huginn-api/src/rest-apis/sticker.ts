import { Routes, type APISticker, type APIGetStickerCategoriesResult } from "@huginnjs/shared";

import type { CDN } from "../cdn";
import type { REST } from "../rest";

export class StickerAPI {
   constructor(
      private readonly rest: REST,
      private readonly cdn: CDN,
   ) {}

   private resolve(sticker: APISticker): APISticker {
      if (sticker.source !== "custom") return sticker;
      const src = this.cdn.sticker(sticker.id);
      return { ...sticker, src, url: src };
   }

   public async getCategories(): Promise<APIGetStickerCategoriesResult> {
      return this.rest.get(Routes.stickerCategories(), { auth: true }) as Promise<APIGetStickerCategoriesResult>;
   }

   public async getTrending(limit = 24, page = 1): Promise<APISticker[]> {
      return this.rest.get(Routes.trendingStickers(), { auth: true, query: new URLSearchParams({ limit: String(limit), page: String(page) }) }) as Promise<
         APISticker[]
      >;
   }

   public async search(query: string, limit = 24, page = 1): Promise<APISticker[]> {
      return this.rest.get(Routes.searchStickers(), { auth: true, query: new URLSearchParams({ query, limit: String(limit), page: String(page) }) }) as Promise<
         APISticker[]
      >;
   }

   public async getMine(query = "", limit = 24, page = 1): Promise<APISticker[]> {
      const stickers = (await this.rest.get(Routes.userStickers(), {
         auth: true,
         query: new URLSearchParams({ query, limit: String(limit), page: String(page) }),
      })) as APISticker[];
      return stickers.map((sticker) => this.resolve(sticker));
   }

   public async upload(file: { data: ArrayBuffer; name: string; contentType?: string }, title?: string): Promise<APISticker> {
      const sticker = (await this.rest.post(Routes.stickers(), {
         auth: true,
         files: [file],
         body: title ? { title } : undefined,
         appendToFormData: true,
      })) as APISticker;
      return this.resolve(sticker);
   }

   public async delete(id: string): Promise<void> {
      await this.rest.delete(Routes.userSticker(id), { auth: true });
   }
}
