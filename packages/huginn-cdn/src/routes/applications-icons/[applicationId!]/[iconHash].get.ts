import { storage } from "#setup";
import { createRoute, fileNotFound, tryCatch } from "@huginn/backend-shared";
import { HttpCode } from "@huginn/shared";

// Param 1 can be both applicationId or iconHash since it's optional
createRoute("GET", "/cdn/application-icons/:param1/:param2?", async (c) => {
   const { param1, param2 } = c.req.param();

   const applicationId = param2 ? param1 : undefined;
   const iconHash = param2 ?? param1;

   const [error, file] = await tryCatch(async () => await storage.getFile("application-icons", applicationId ?? "", iconHash));

   if (!file || error) {
      return fileNotFound(c);
   }

   return c.body(file, HttpCode.OK);
});
