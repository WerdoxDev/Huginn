import { storage } from "#setup";
import { invalidBody, verifyJwt } from "@huginn/backend-shared";
import Elysia, { t } from "elysia";

const schema = t.Object({ files: t.Array(t.File()) });

export const postChannelIcon = new Elysia().use(verifyJwt("cdn")).post(
   "/cdn/channel-icons/:channelId",
   async ({ body, status, params: { channelId } }) => {
      const file = body.files[0];

      if (!file) {
         return invalidBody(status);
      }

      await storage.writeFile("channel-icons", channelId, file.name, file.stream());

      return status("Created", file.name);
   },
   { body: schema },
);
