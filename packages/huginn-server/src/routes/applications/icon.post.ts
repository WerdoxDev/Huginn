import { invalidBody, verifyJwt } from "@huginn/backend-shared";
import { CDNRoutes, getFileHash, toArrayBuffer, type APIPostApplicationIconResult } from "@huginnjs/shared";
import Elysia, { t } from "elysia";

import { cdnUpload } from "#utils/server-request";

const schema = t.Object({ icon: t.String(), applicationId: t.Optional(t.Number()) });

export const postApplicationIcon = new Elysia().use(verifyJwt()).post(
   "/api/applications/icon",
   async ({ body, status }) => {
      if (!body.icon) {
         return invalidBody(status);
      }

      const data = toArrayBuffer(body.icon);
      const hash = getFileHash(data);
      await cdnUpload(CDNRoutes.uploadApplicationIcon(body.applicationId), {
         files: [{ data: data, name: hash }],
      });

      return status("Created", hash as APIPostApplicationIconResult);
   },
   { body: schema },
);
