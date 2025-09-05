import { createRoute, invalidFormBody, tryCatch, verifyJwt } from "@huginn/backend-shared";
import { HttpCode } from "@huginn/shared";
import { storage } from "#setup";

createRoute("POST", "/cdn/avatars/:userId", verifyJwt("cdn"), async (c) => {
   const { userId } = c.req.param();
   const [error, body] = await tryCatch(async () => await c.req.formData());

   if (error) {
      return invalidFormBody(c);
   }

   const file = body.get("files[0]");

   if (!body || !file || !(file instanceof File)) {
      return invalidFormBody(c);
   }

   await storage.writeFile("avatars", userId, file.name, file.stream());

   return c.text(file.name, HttpCode.CREATED);
});
