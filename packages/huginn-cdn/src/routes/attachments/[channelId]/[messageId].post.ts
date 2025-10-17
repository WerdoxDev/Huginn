import { elysia, verifyJwt2 } from "@huginn/backend-shared";
import { storage } from "#setup";
import Elysia, { t } from "elysia";

const schema = t.Object({ files: t.Record(t.String(), t.File()) });

export const postMessageAttachment = new Elysia().use(verifyJwt2("cdn")).post(
   "/cdn/attachments/:channelId/:messageId",
   async ({ body, params: { channelId, messageId }, status }) => {
      const file = body.files[0];

      if (!file) {
         return elysia.invalidBody(status);
      }

      await storage.writeFile("attachments", `${channelId}/${messageId}`, file.name, file.stream());

      return status("Created", file.name);
   },
   { body: schema },
);
