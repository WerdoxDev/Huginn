import { elysia, verifyJwt2 } from "@huginn/backend-shared";
import { storage } from "#setup";
import Elysia, { t } from "elysia";

const schema = t.Object({ files: t.Record(t.String(), t.File()) });

export const postUserAvatar = new Elysia().use(verifyJwt2("cdn")).post(
   "/cdn/avatars/:userId",
   async ({ body, status, params: { userId } }) => {
      const file = body.files[0];

      if (!file) {
         return elysia.invalidBody(status);
      }

      await storage.writeFile("avatars", userId, file.name, file.stream());

      return status("Created", file.name);
   },
   { body: schema },
);
