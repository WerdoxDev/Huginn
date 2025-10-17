import { fileNotFound, globalPlugin } from "@huginn/backend-shared";
import { type ImageFormats, fileTypes, isImageMediaType, isVideoMediaType } from "@huginn/shared";
import type { S3Stats } from "bun";
import { cacheStorage, envs, storage } from "#setup";
import { extractFileInfo, transformImage } from "#utils/file-utils";
import { getCacheDir } from "#utils/route-utils";
import Elysia, { StatusMap, t } from "elysia";

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
   async ({
      query: { ex, hm, format, height, quality, width },
      status,
      path,
      params: { channelId, filename, messageId },
      headers,
      global,
   }) => {
      const hasher = new Bun.CryptoHasher("sha256", envs.CDN_HMAC_SECRET);

      const hashPath = path.replace("/cdn/", "");
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
               return new Response(file, {
                  status: StatusMap["Partial Content"],
                  headers: {
                     "content-type": mimeType,
                     "content-range": `bytes ${start}-${end}/${head.size}`,
                     "accept-ranges": "bytes",
                     "content-length": chunkSize.toString(),
                  },
               });
            }
         }
      }

      const cacheDir = getCacheDir(format, quality, width, height);

      // We don't cache an image without any modifiers
      if ((format || quality || width || height) && isImageMediaType(mimeType)) {
         const cachedFile = await cacheStorage.getFile("attachments", `${channelId}/${messageId}/${cacheDir}`, filename);

         if (cachedFile) {
            return new Response(cachedFile, { status: StatusMap["OK"], headers: { "content-type": mimeType } });
         }
      }

      const file = await storage.getFile("attachments", `${channelId}/${messageId}`, filename);

      if (!file) {
         return fileNotFound(status);
      }

      if ((format || quality || width || height) && isImageMediaType(mimeType)) {
         const { readable, writable } = new TransformStream();

         await transformImage(
            file as ReadableStream,
            writable,
            Object.entries(fileTypes).find((x) => x[1] === mimeType)?.[0] as ImageFormats,
            quality,
            width,
            height,
         );

         const [readable1, readable2] = readable.tee();

         global.waitUntil(async () => {
            // if (readable2) {
            await cacheStorage.writeFile("attachments", `${channelId}/${messageId}/${cacheDir}`, filename, readable2);
            // }
         });

         // Write the image in cache
         // waitUntil(c, async () => {
         // });

         return new Response(readable1, {
            status: StatusMap["OK"],
            headers: { "content-type": format ? fileTypes[format as ImageFormats] : mimeType },
         });
      }

      return new Response(file, { status: StatusMap["OK"], headers: { "content-type": mimeType } });
   },
   {
      query: querySchema,
   },
);
