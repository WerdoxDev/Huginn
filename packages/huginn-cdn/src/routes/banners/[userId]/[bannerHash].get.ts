import { storage } from "#setup";
import { tryResolveImage } from "#utils/route-utils";
import { globalPlugin } from "@huginn/backend-shared";
import Elysia, { StatusMap } from "elysia";

export const getUserBanner = new Elysia()
   .use(globalPlugin)
   .get("/cdn/banners/:userId/:bannerHash", async ({ params: { bannerHash, userId }, global }) => {
      const { mimeType, readable, cacheReadable } = await tryResolveImage("banners", userId, bannerHash);

      global.waitUntil(async () => {
         if (cacheReadable) {
            await storage.writeFile("banners", userId, bannerHash, cacheReadable);
         }
      });

      return new Response(readable, {
         status: StatusMap["OK"],
         headers: { "content-type": mimeType },
      });
   });
