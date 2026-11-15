import { fileNotFound } from "@huginn/backend-shared";
import Elysia, { t } from "elysia";

import { storage } from "#server";
import { hasValidSignature, signatureQuery } from "#utils/signature";

export const getSticker = new Elysia().get(
   "/cdn/stickers/:filename",
   async ({ path, query, params: { filename }, status }) => {
      if (!hasValidSignature(path, query)) return fileNotFound(status);
      const file = await storage.getFile("stickers", "", filename);
      if (!file) return fileNotFound(status);
      return new Response(file.stream(), {
         headers: { "Content-Type": "image/webp", "X-Content-Type-Options": "nosniff", "Cache-Control": "private, no-store" },
      });
   },
   { query: t.Object(signatureQuery), params: t.Object({ filename: t.String({ pattern: "^[0-9]{1,20}\\.webp$" }) }) },
);
