import type { APIGif, APISticker, Snowflake } from "@huginnjs/shared";

import { env } from "#setup";

type MediaKind = "gifs" | "stickers";
type MediaQuality = "hd" | "md" | "sm" | "xs";
type MediaFormatName = "gif" | "webp" | "jpg" | "mp4" | "webm";
type MediaFormat = { url: string; width: number; height: number; size?: number };
type MediaFiles = Partial<Record<MediaQuality, Partial<Record<MediaFormatName, MediaFormat>>>>;
type MediaItem = { slug: string; title: string; file: MediaFiles; blur_preview?: string };
type GifItem = MediaItem & { id: number; blur_preview: string };
type MediaPage<T> = { data: T[]; current_page?: number; per_page?: number; has_next?: boolean };
type Categories = { locale: string; categories: Array<{ category: string; query: string; preview_url: string }> };
type KlipyResponse<T> = { result: boolean; data: T };
type QueryParams = Record<string, string | number | undefined>;

async function request<T>(kind: MediaKind, endpoint: "trending" | "search" | "categories" | "items", params: QueryParams = {}): Promise<KlipyResponse<T>> {
   const url = new URL(`https://api.klipy.com/api/v1/${env.KLIPY_KEY}/${kind}/${endpoint}`);
   for (const [key, value] of Object.entries(params)) {
      if (value !== undefined) url.searchParams.set(key, String(value));
   }

   const response = await fetch(url, { signal: AbortSignal.timeout(10_000) });
   if (!response.ok) throw new Error(`Klipy request failed (${response.status})`);
   const json = (await response.json()) as KlipyResponse<T>;
   if (!json.result || !json.data) throw new Error("Invalid Klipy response");
   return json;
}

function fetchMedia<T extends MediaItem>(kind: MediaKind, userId: Snowflake, query?: string, limit?: number, page?: number) {
   return request<MediaPage<T>>(kind, query === undefined ? "trending" : "search", {
      customer_id: userId,
      q: query,
      per_page: limit,
      page,
      format_filter: kind === "stickers" ? "webp,gif" : undefined,
   });
}

function fetchItems<T extends MediaItem>(kind: MediaKind, slugs: string[]) {
   return request<MediaPage<T>>(kind, "items", {
      slugs: slugs.join(","),
      format_filter: kind === "stickers" ? "webp,gif" : undefined,
   });
}

function formatMedia(item: MediaItem, kind: MediaKind, file: MediaFormat) {
   return {
      title: item.title,
      url: `https://klipy.com/${kind}/${item.slug}`,
      src: file.url,
      width: file.width,
      height: file.height,
   };
}

export function fetchTrendingGifs(userId: Snowflake, limit?: number, page?: number) {
   return fetchMedia<GifItem>("gifs", userId, undefined, limit, page);
}

export function fetchSearchGifs(userId: Snowflake, query: string, limit?: number, page?: number) {
   return fetchMedia<GifItem>("gifs", userId, query, limit, page);
}

export function fetchGifCategories() {
   return request<Categories>("gifs", "categories");
}

export function fetchGifItems(slugs: string[]) {
   return fetchItems<GifItem>("gifs", slugs);
}

export function filterGifs(gifs: MediaPage<GifItem>, options: { quality: MediaQuality; format: MediaFormatName }): APIGif[] {
   return gifs.data.flatMap((item) => {
      const file = item.file[options.quality]?.[options.format];
      if (!file?.url || !file.width || !file.height) return [];
      return [{ ...formatMedia(item, "gifs", file), id: item.id, preview: item.blur_preview }];
   });
}

export async function fetchStickers(userId: Snowflake, query?: string, limit = 24, page = 1) {
   const result = await fetchMedia<MediaItem>("stickers", userId, query || undefined, limit, page);
   return filterStickers(result.data.data);
}

export async function fetchStickerCategories() {
   const result = await request<Categories>("stickers", "categories");
   return result.data.categories.map((item) => ({ name: item.category, src: item.preview_url }));
}

export async function fetchStickerItem(slug: string) {
   const result = await fetchItems<MediaItem>("stickers", [slug]);
   return filterStickers(result.data.data)[0];
}

export function filterStickers(items: MediaItem[]): APISticker[] {
   return items.flatMap((item) => {
      const file = item.file.sm?.webp ?? item.file.sm?.gif ?? item.file.md?.webp ?? item.file.md?.gif ?? item.file.hd?.webp ?? item.file.hd?.gif;
      if (!file?.url || !file.width || !file.height) return [];
      return [{ ...formatMedia(item, "stickers", file), source: "klipy" as const, id: item.slug, preview: item.blur_preview }];
   });
}
