import { invalidBody, verifyJwt } from "@huginn/backend-shared";
import Elysia, { t } from "elysia";

import { storage } from "#server";

const schema = t.Object({ files: t.Array(t.File()) });

export const postChannelBackground = new Elysia()
   .use(verifyJwt("cdn"))
   .post("/cdn/channel-backgrounds/:scope/:userId", { body: schema }, async ({ body, status, params: { scope, userId } }) => {
      const file = body.files[0];

      if (!file) {
         return invalidBody(status);
      }

      await storage.writeFile("channel-backgrounds", `${scope}/${userId}`, file.name, file);

      return status("Created", file.name);
   });
