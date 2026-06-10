import { globalPlugin } from "@huginn/backend-shared";
import Elysia, { StatusMap, t } from "elysia";

import { storage } from "#setup";
import { extractFileInfo } from "#utils/file-utils";
import { tryResolveImage } from "#utils/route-utils";

const querySchema = t.Object({
   size: t.Optional(t.Number()),
});

export const getUserAvatar = new Elysia().use(globalPlugin).get(
   "/cdn/avatars/:userId/:avatarHash",
   async ({ params: { avatarHash, userId }, query: { size }, global }) => {
      const { file, transformation } = await tryResolveImage("avatars", userId, avatarHash, { width: size, height: size });

      // Cache the file if it was transformed
      if (transformation) {
         global.waitUntil(async () => {
            await storage.writeFile("avatars", userId, transformation.key, file);
         });
      }

      return new Response(file.stream(), { status: StatusMap["OK"], headers: { "content-type": extractFileInfo(avatarHash).mimeType } });
   },
   { query: querySchema },
);
