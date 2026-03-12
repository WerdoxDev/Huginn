import { storage } from "#setup";
import { tryResolveImage } from "#utils/route-utils";
import { globalPlugin } from "@huginn/backend-shared";
import Elysia, { StatusMap } from "elysia";

export const getUserAvatar = new Elysia()
   .use(globalPlugin)
   .get("/cdn/avatars/:userId/:avatarHash", async ({ params: { avatarHash, userId }, global }) => {
      const { mimeType, readable, cacheReadable } = await tryResolveImage("avatars", userId, avatarHash);

      global.waitUntil(async () => {
         if (cacheReadable) {
            await storage.writeFile("avatars", userId, avatarHash, cacheReadable);
         }
      });

      return new Response(readable, {
         status: StatusMap["OK"],
         headers: { "content-type": mimeType },
      });
   });
