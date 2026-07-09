import type { APIGif, Snowflake } from "@huginn/shared";

import { env } from "#setup";

type Format = {
   url: string;
   width: number;
   height: number;
   size: number;
};

type File = {
   gif: Format;
   webp: Format;
   jpg: Format;
   mp4: Format;
   webm: Format;
};

type Files = {
   hd: File;
   md: File;
   sm: File;
   xs: File;
};

type GifsResponse = {
   data: {
      data: Array<{ id: number; slug: string; title: string; file: Files; tags: string[]; type: string; blur_preview: string }>;
      current_page: number;
      per_page: number;
      has_next: boolean;
   };
};

type GifCategoriesResponse = {
   data: {
      locale: string;
      categories: Array<{ category: string; query: string; preview_url: string }>;
   };
};

const headers = {
   "Content-Type": "application/json",
};

export async function fetchTrendingGifs(userId: Snowflake, limit?: number, page?: number) {
   const result = await fetch(
      `https://api.klipy.com/api/v1/${env.KLIPY_KEY}/gifs/trending?customer_id=${userId}` + (limit ? `&per_page=${limit}` : "") + (page ? `&page=${page}` : ""),
      {
         method: "GET",
         redirect: "follow",
         headers: headers,
      },
   );

   const json = (await result.json()) as GifsResponse;
   return json;
}

export async function fetchGifCategories() {
   const result = await fetch(`https://api.klipy.com/api/v1/${env.KLIPY_KEY}/gifs/categories`, {
      method: "GET",
      redirect: "follow",
      headers: headers,
   });

   const json = (await result.json()) as GifCategoriesResponse;
   return json;
}

export async function fetchSearchGifs(userId: Snowflake, query: string, limit?: number, page?: number) {
   const result = await fetch(
      `https://api.klipy.com/api/v1/${env.KLIPY_KEY}/gifs/search?customer_id=${userId}&q=${query}` +
         (limit ? `&per_page=${limit}` : "") +
         (page ? `&page=${page}` : ""),
      {
         method: "GET",
         redirect: "follow",
         headers: headers,
      },
   );

   const json = (await result.json()) as GifsResponse;
   return json;
}

export async function fetchGifItems(slugs: string[]) {
   const result = await fetch(`https://api.klipy.com/api/v1/${env.KLIPY_KEY}/gifs/items?slugs=${slugs.join(",")}`, {
      method: "GET",
      redirect: "follow",
      headers: headers,
   });

   const json = (await result.json()) as GifsResponse;
   return json;
}

export function filterGifs(gifs: GifsResponse["data"], options: { quality: keyof Files; format: keyof File }): APIGif[] {
   return gifs.data.map((x) => {
      return {
         id: x.id,
         title: x.title,
         width: x.file[options.quality][options.format].width,
         height: x.file[options.quality][options.format].height,
         preview: x.blur_preview,
         url: "https://klipy.com/gifs/" + x.slug,
         src: x.file[options.quality][options.format].url,
      };
   });
}
