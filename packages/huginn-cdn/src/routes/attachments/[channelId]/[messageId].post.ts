import { storage } from "#setup";
import { invalidBody, verifyJwt } from "@huginn/backend-shared";
import Elysia, { t } from "elysia";

const schema = t.Object({ files: t.Array(t.File()) });

export const postMessageAttachment = new Elysia().use(verifyJwt("cdn")).post(
   "/cdn/attachments/:channelId/:messageId",
   async ({ body, params: { channelId, messageId }, status }) => {
      const file = body.files[0];

      if (!file) {
         return invalidBody(status);
      }

      await storage.writeFile("attachments", `${channelId}/${messageId}`, file.name, file);

      return status("Created", file.name);
   },
   {
      body: schema,
   },
);
