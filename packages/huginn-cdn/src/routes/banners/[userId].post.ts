import { storage } from "#setup";
import { invalidBody, verifyJwt } from "@huginn/backend-shared";
import Elysia, { t } from "elysia";

const schema = t.Object({ files: t.Array(t.File()) });

export const postUserBanner = new Elysia().use(verifyJwt("cdn")).post(
   "/cdn/banners/:userId",
   async ({ body, status, params: { userId } }) => {
      const file = body.files[0];

      if (!file) {
         return invalidBody(status);
      }

      await storage.writeFile("banners", userId, file.name, file.stream());

      return status("Created", file.name);
   },
   { body: schema },
);
