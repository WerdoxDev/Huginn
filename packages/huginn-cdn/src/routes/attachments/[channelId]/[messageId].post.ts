import { invalidBody, verifyJwt } from "@huginn/backend-shared";
import Elysia, { t } from "elysia";

import { storage } from "#server";
import { extractFileInfo } from "#utils/file-utils";

const schema = t.Object({ files: t.Array(t.File()) });

export const postMessageAttachment = new Elysia().use(verifyJwt("cdn")).post(
   "/cdn/attachments/:channelId/:messageId",
   async ({ body, params: { channelId, messageId }, status }) => {
      const file = body.files[0];

      if (!file) {
         return invalidBody(status);
      }

      const { name, extension } = extractFileInfo(file.name);
      await storage.writeFile("attachments", `${channelId}/${messageId}`, `${name}.${extension}`, file);

      return status("Created", file.name);
   },
   {
      body: schema,
   },
);
