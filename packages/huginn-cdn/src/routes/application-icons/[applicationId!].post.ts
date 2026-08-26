import { invalidBody, verifyJwt } from "@huginn/backend-shared";
import Elysia, { t } from "elysia";

import { storage } from "#server";
import { extractFileInfo, transformImage } from "#utils/file-utils";

const schema = t.Object({ files: t.Array(t.File()) });

export const postApplicationIcon = new Elysia()
   .use(verifyJwt("cdn"))
   .post("/cdn/application-icons/:applicationId?", { body: schema }, async ({ body, status, params: { applicationId } }) => {
      const file = body.files[0];

      if (!file) {
         return invalidBody(status);
      }

      const { name } = extractFileInfo(file.name);

      const transformedFile = await transformImage(file, { format: "webp", width: 32, height: 32 });

      await storage.writeFile("application-icons", applicationId ?? "", `${name}.webp`, transformedFile);

      return status("Created", name);
   });
