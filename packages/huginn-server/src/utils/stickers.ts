import type { APISticker, APIStickerReference } from "@huginnjs/shared";

import { prisma } from "@huginn/backend-shared/database";

import { fetchStickerItem } from "./klipy";

export function customStickerToAPI(sticker: { id: bigint; title: string; asset: string; width: number; height: number }): APISticker {
   return {
      source: "custom",
      id: sticker.id.toString(),
      title: sticker.title,
      src: sticker.asset,
      url: sticker.asset,
      width: sticker.width,
      height: sticker.height,
   };
}

export async function resolveSticker(reference: APIStickerReference): Promise<APISticker | undefined> {
   if (reference.source === "klipy") return fetchStickerItem(reference.id);
   if (!/^\d{1,19}$/.test(reference.id) || BigInt(reference.id) > 9223372036854775807n) return undefined;
   const sticker = await prisma.sticker.findUnique({ where: { id: BigInt(reference.id) } });
   return sticker ? customStickerToAPI(sticker) : undefined;
}

