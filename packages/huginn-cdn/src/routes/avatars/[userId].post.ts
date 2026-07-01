import { invalidBody, verifyJwt } from "@huginn/backend-shared";
import Elysia, { t } from "elysia";

import { storage } from "#server";

const schema = t.Object({ files: t.Array(t.File()) });

export const postUserAvatar = new Elysia().use(verifyJwt("cdn")).post(
   "/cdn/avatars/:userId",
   async ({ body, status, params: { userId } }) => {
      const file = body.files[0];

      if (!file) {
         return invalidBody(status);
      }

      await storage.writeFile("avatars", userId, file.name, file);

      return status("Created", file.name);
   },
   { body: schema },
);
