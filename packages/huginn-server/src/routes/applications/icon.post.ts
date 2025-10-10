import { cdnUpload } from "#utils/server-request";
import { elysia, verifyJwt2 } from "@huginn/backend-shared";
import { CDNRoutes, getFileHash, toArrayBuffer, type APIPostApplicationIconResult } from "@huginn/shared";
import Elysia, { t } from "elysia";

const schema = t.Object({ icon: t.String(), applicationId: t.Optional(t.Number()) });

export const postApplicationIcon = new Elysia().use(verifyJwt2()).post(
   "/api/applications/icon",
   async ({ body, status }) => {
      if (!body.icon) {
         return elysia.invalidBody(status);
      }

      const data = toArrayBuffer(body.icon);
      const hash = getFileHash(data);
      await cdnUpload(CDNRoutes.uploadApplicationIcon(body.applicationId), { files: [{ data: data, name: hash }] });

      return status("Created", hash as APIPostApplicationIconResult);
   },
   { body: schema },
);
