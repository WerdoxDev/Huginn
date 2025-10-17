import { elysia, verifyJwt2 } from "@huginn/backend-shared";
import { storage } from "#setup";
import Elysia, { t } from "elysia";

const schema = t.Object({ files: t.Record(t.String(), t.File()) });

export const postChannelIcon = new Elysia().use(verifyJwt2("cdn")).post(
   "/cdn/channel-icons/:channelId",
   async ({ body, status, params: { channelId } }) => {
      const file = body.files[0];

      if (!file) {
         return elysia.invalidBody(status);
      }

      await storage.writeFile("channel-icons", channelId, file.name, file.stream());

      return status("Created", file.name);
   },
   { body: schema },
);
