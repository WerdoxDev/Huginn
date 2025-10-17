import { storage } from "#setup";
import { fileNotFound, tryCatch } from "@huginn/backend-shared";
import Elysia, { StatusMap } from "elysia";

// Param 1 can be both applicationId or iconHash since it's optional
export const getApplicationIcon = new Elysia().get(
   "/cdn/application-icons/:param1/:param2?",
   async ({ params: { param1, param2 }, status }) => {
      const applicationId = param2 ? param1 : undefined;
      const iconHash = param2 ?? param1;

      const [error, file] = await tryCatch(async () => await storage.getFile("application-icons", applicationId ?? "", iconHash));

      if (!file || error) {
         return fileNotFound(status);
      }

      return new Response(file, { status: StatusMap["OK"], headers: { "content-type": "image/webp" } });
   },
);
