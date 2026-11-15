import { fileNotFound } from "@huginn/backend-shared";
import Elysia, { t } from "elysia";

import { storage } from "#server";
import { hasValidSignature, signatureQuery } from "#utils/signature";

export const getGif = new Elysia().get(
   "/cdn/gifs/:filename",
   async ({ path, query, params: { filename }, status }) => {
      if (!hasValidSignature(path, query)) return fileNotFound(status);
      const file = await storage.getFile("gifs", "", filename);
      if (!file) return fileNotFound(status);
      return new Response(file.stream(), {
         headers: { "Content-Type": "image/gif", "X-Content-Type-Options": "nosniff", "Cache-Control": "private, no-store" },
      });
   },
   {
      params: t.Object({ filename: t.String({ pattern: "^[0-9]{1,20}\\.gif$" }) }),
      query: t.Object(signatureQuery),
   },
);
