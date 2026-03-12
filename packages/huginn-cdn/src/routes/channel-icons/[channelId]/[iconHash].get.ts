import { storage } from "#setup";
import { tryResolveImage } from "#utils/route-utils";
import { globalPlugin } from "@huginn/backend-shared";
import Elysia, { StatusMap } from "elysia";

export const getChannelIcon = new Elysia()
   .use(globalPlugin)
   .get("/cdn/channel-icons/:channelId/:iconHash", async ({ params: { channelId, iconHash }, global }) => {
      const { mimeType, readable, cacheReadable } = await tryResolveImage("channel-icons", channelId, iconHash);

      global.waitUntil(async () => {
         if (cacheReadable) {
            await storage.writeFile("channel-icons", channelId, iconHash, cacheReadable);
         }
      });

      return new Response(readable, {
         status: StatusMap["OK"],
         headers: { "content-type": mimeType },
      });
   });
