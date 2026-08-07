import { globalPlugin } from "@huginn/backend-shared";
import Elysia, { StatusMap } from "elysia";

import { storage } from "#server";
import { extractFileInfo } from "#utils/file-utils";
import { tryResolveImage } from "#utils/route-utils";

export const getChannelBackground = new Elysia()
   .use(globalPlugin)
   .get("/cdn/channel-backgrounds/:channelId/:userId/:backgroundHash", async ({ params: { channelId, userId, backgroundHash }, global }) => {
      const { file, transformation } = await tryResolveImage("channel-backgrounds", `${channelId}/${userId}`, backgroundHash);

      // Cache the file if it was transformed
      if (transformation) {
         global.waitUntil(async () => {
            await storage.writeFile("channel-backgrounds", `${channelId}/${userId}`, transformation.key, file);
         });
      }

      return new Response(file.stream(), { status: StatusMap["OK"], headers: { "content-type": extractFileInfo(backgroundHash).mimeType } });
   });
