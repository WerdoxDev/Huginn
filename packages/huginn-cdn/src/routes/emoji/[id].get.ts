import { fileNotFound } from "@huginn/backend-shared";
import Elysia, { StatusMap } from "elysia";

import { storage } from "#setup";
import { extractFileInfo } from "#utils/file-utils";

export const getEmoji = new Elysia().get("/cdn/emoji/:id", async ({ params: { id }, status }) => {
   const file = await storage.getFile("emojis", "", id.toLowerCase());
   if (!file) return fileNotFound(status);

   return new Response(file.stream(), { status: StatusMap["OK"], headers: { "content-type": extractFileInfo(id).mimeType } });
});
