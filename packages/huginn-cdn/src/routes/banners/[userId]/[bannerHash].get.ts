import { globalPlugin } from "@huginn/backend-shared";
import Elysia, { StatusMap } from "elysia";

import { storage } from "#setup";
import { extractFileInfo } from "#utils/file-utils";
import { tryResolveImage } from "#utils/route-utils";

export const getUserBanner = new Elysia()
   .use(globalPlugin)
   .get("/cdn/banners/:userId/:bannerHash", async ({ params: { bannerHash, userId }, global }) => {
      const { file, transformation } = await tryResolveImage("banners", userId, bannerHash);

      if (transformation) {
         global.waitUntil(async () => {
            await storage.writeFile("banners", userId, bannerHash, file);
         });
      }

      return new Response(file.stream(), { status: StatusMap["OK"], headers: { "content-type": extractFileInfo(bannerHash).mimeType } });
   });
