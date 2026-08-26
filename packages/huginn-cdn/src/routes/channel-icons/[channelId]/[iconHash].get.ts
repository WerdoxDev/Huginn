import { globalPlugin } from "@huginn/backend-shared";
import Elysia, { StatusMap, t } from "elysia";

import { storage } from "#server";
import { extractFileInfo } from "#utils/file-utils";
import { tryResolveImage } from "#utils/route-utils";

const querySchema = t.Object({
   size: t.Optional(t.Number()),
});

export const getChannelIcon = new Elysia()
   .use(globalPlugin)
   .get("/cdn/channel-icons/:channelId/:iconHash", { query: querySchema }, async ({ params: { channelId, iconHash }, query: { size }, global }) => {
      const { file, transformation } = await tryResolveImage("channel-icons", channelId, iconHash, { width: size, height: size });

      // Cache the file if it was transformed
      if (transformation) {
         global.waitUntil(async () => {
            await storage.writeFile("channel-icons", channelId, transformation.key, file);
         });
      }

      return new Response(file.stream(), { status: StatusMap["OK"], headers: { "content-type": extractFileInfo(iconHash).mimeType } });
   });
