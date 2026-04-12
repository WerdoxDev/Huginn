import { storage } from "#setup";
import { extractFileInfo, transformImage } from "#utils/file-utils";
import { invalidBody, verifyJwt } from "@huginn/backend-shared";
import Elysia, { t } from "elysia";

const schema = t.Object({ files: t.Array(t.File()) });

export const postApplicationIcon = new Elysia().use(verifyJwt("cdn")).post(
   "/cdn/application-icons/:applicationId?",
   async ({ body, status, params: { applicationId } }) => {
      const file = body.files[0];

      if (!file) {
         return invalidBody(status);
      }

      const fileStream = file.stream();
      const { name } = extractFileInfo(file.name);

      const { readable, writable } = new TransformStream();

      await transformImage(fileStream, writable, "webp", undefined, 32, 32);

      await storage.writeFile("application-icons", applicationId ?? "", `${name}.webp`, readable);

      return status("Created", name);
   },
   {
      body: schema,
   },
);
