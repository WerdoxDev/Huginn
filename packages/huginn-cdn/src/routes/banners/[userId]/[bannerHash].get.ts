import { storage } from "#setup";
import { tryResolveImage } from "#utils/route-utils";
import { globalPlugin } from "@huginn/backend-shared";
import Elysia, { StatusMap } from "elysia";

export const getUserBanner = new Elysia()
   .use(globalPlugin)
   .get("/cdn/banners/:userId/:bannerHash", async ({ params: { bannerHash, userId }, global }) => {
      const { file, transformation } = await tryResolveImage("banners", userId, bannerHash);

      if (transformation) {
         global.waitUntil(async () => {
            await storage.writeFile("banners", userId, bannerHash, file);
         });
      }

      return new Response(file.stream(), { status: StatusMap["OK"], headers: { "content-type": file.type } });
   });
