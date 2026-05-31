import { storage } from "#setup";
import { tryResolveImage } from "#utils/route-utils";
import { globalPlugin } from "@huginn/backend-shared";
import Elysia, { StatusMap, t } from "elysia";

const querySchema = t.Object({
   size: t.Optional(t.Number()),
});

export const getChannelIcon = new Elysia().use(globalPlugin).get(
   "/cdn/channel-icons/:channelId/:iconHash",
   async ({ params: { channelId, iconHash }, query: { size }, global }) => {
      const { file, transformation } = await tryResolveImage("channel-icons", channelId, iconHash, { width: size, height: size });

      // Cache the file if it was transformed
      if (transformation) {
         global.waitUntil(async () => {
            await storage.writeFile("channel-icons", channelId, transformation.key, file);
         });
      }

      return new Response(file.stream(), { status: StatusMap["OK"], headers: { "content-type": file.type } });
   },
   { query: querySchema },
);
