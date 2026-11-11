import { fileNotFound } from "@huginn/backend-shared";
import Elysia, { t } from "elysia";

import { storage } from "#server";

export const getSticker = new Elysia().get(
   "/cdn/stickers/:filename",
   async ({ params: { filename }, status }) => {
      const file = await storage.getFile("stickers", "", filename);
      if (!file) return fileNotFound(status);
      return new Response(file.stream(), { headers: { "Content-Type": "image/webp", "X-Content-Type-Options": "nosniff" } });
   },
   { params: t.Object({ filename: t.String({ pattern: "^[0-9]{1,20}\\.webp$" }) }) },
);
