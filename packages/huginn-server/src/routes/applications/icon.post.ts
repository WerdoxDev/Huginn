import { cdnUpload } from "#utils/server-request";
import { createRoute, invalidFormBody, validator, verifyJwt } from "@huginn/backend-shared";
import { CDNRoutes, getFileHash, HttpCode, toArrayBuffer, type APIPostApplicationIconResult } from "@huginn/shared";
import z from "zod";

const schema = z.object({ icon: z.string(), applicationId: z.optional(z.number()) });

createRoute("POST", "/api/applications/icon", verifyJwt(), validator("json", schema), async (c) => {
   const body = c.req.valid("json");

   if (!body.icon) {
      return invalidFormBody(c);
   }

   const data = toArrayBuffer(body.icon);
   const hash = getFileHash(data);
   await cdnUpload(CDNRoutes.uploadApplicationIcon(body.applicationId), { files: [{ data: data, name: hash }] });

   return c.text(hash as APIPostApplicationIconResult, HttpCode.CREATED);
});
