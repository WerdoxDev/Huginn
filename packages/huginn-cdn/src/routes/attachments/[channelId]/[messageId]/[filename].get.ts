import type { S3Stats } from "bun";

import { fileNotFound, globalPlugin } from "@huginn/backend-shared";
import { type ImageFormats, isImageMediaType, isVideoMediaType } from "@huginn/shared";
import Elysia, { StatusMap, t } from "elysia";

import { envs, storage } from "#setup";
import { extractFileInfo } from "#utils/file-utils";
import { tryResolveImage } from "#utils/route-utils";

const querySchema = t.Object({
   hm: t.String(),
   ex: t.Number(),
   format: t.Optional(t.String()),
   quality: t.Optional(t.Number({ minimum: 0, maximum: 100 })),
   width: t.Optional(t.Number()),
   height: t.Optional(t.Number()),
});

export const getMessageAttachment = new Elysia().use(globalPlugin).get(
   "/cdn/attachments/:channelId/:messageId/:filename",
   async ({ status, path, params: { channelId, filename, messageId }, headers, global, query: { ex, hm, format, height, quality, width } }) => {
      const hasher = new Bun.CryptoHasher("sha256", envs.CDN_HMAC_SECRET);

      const hashPath = decodeURIComponent(path.replace("/cdn/", ""));
      hasher.update(`${hashPath}:${ex}`);
      const expectedSignature = hasher.digest("hex");

      if (expectedSignature !== hm) {
         return fileNotFound(status);
      }

      const now = Math.floor(Date.now() / 1000);
      if (ex < now) {
         return fileNotFound(status);
      }

      const { mimeType } = extractFileInfo(filename);

      // Video files with range require getting a specific range of bytes from the video
      if (isVideoMediaType(mimeType)) {
         const head = (await storage.stat("attachments", `${channelId}/${messageId}`, filename)) as S3Stats;
         if (!head) {
            return fileNotFound(status);
         }

         const range = headers["range"];
         if (range) {
            const parts = range.replace(/bytes=/, "").split("-");
            const start = Number.parseInt(parts[0], 10);
            const end = parts[1] ? Number.parseInt(parts[1], 10) : (head.size ?? 0) - 1;
            const chunkSize = end - start + 1;
            const file = await storage.getFile("attachments", `${channelId}/${messageId}`, filename, start, end);

            if (file) {
               return new Response(file.stream(), {
                  status: StatusMap["Partial Content"],
                  headers: {
                     "content-type": file.type,
                     "content-range": `bytes ${start}-${end}/${head.size}`,
                     "accept-ranges": "bytes",
                     "content-length": chunkSize.toString(),
                  },
               });
            }
         }
      }

      if (isImageMediaType(mimeType)) {
         const { file, transformation } = await tryResolveImage("attachments", `${channelId}/${messageId}`, filename, {
            width,
            height,
            quality,
            format: format as ImageFormats,
         });

         if (transformation) {
            global.waitUntil(async () => {
               await storage.writeFile("attachments", `${channelId}/${messageId}`, transformation.key, file);
            });
         }

         return new Response(file.stream(), { status: StatusMap["OK"], headers: { "content-type": file.type } });
      }

      const file = await storage.getFile("attachments", `${channelId}/${messageId}`, filename);
      if (!file) {
         return fileNotFound(status);
      }

      return new Response(file.stream(), { status: StatusMap["OK"], headers: { "content-type": extractFileInfo(filename).mimeType } });
   },
   {
      query: querySchema,
   },
);
