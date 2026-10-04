import { fileNotFound, tryCatch } from "@huginn/backend-shared";
import Elysia, { StatusMap } from "elysia";

import { storage } from "#server";

export const getApplicationIcon = new Elysia().get("/cdn/application-icons/:id/:iconHash", async ({ params: { id, iconHash }, status }) => {
   const [error, file] = await tryCatch(async () => await storage.getFile("application-icons", id, iconHash));

   if (!file || error) {
      return fileNotFound(status);
   }

   return new Response(file.stream(), { status: StatusMap["OK"], headers: { "content-type": "image/webp" } });
});
