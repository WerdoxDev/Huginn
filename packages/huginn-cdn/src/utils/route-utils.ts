import type { FileCategory } from "#utils/types";

import { storage } from "#setup";
import { type ImageFormats } from "@huginn/shared";

import { extractFileInfo, findImageByName, transformImage } from "./file-utils";

export async function tryResolveImage(category: FileCategory, subDirectory: string, hash: string) {
   const { name, format, mimeType } = extractFileInfo(hash);

   const exists = await storage.exists(category, subDirectory, `${name}.${format}`);

   // Best scenario, file already exists and ready to serve
   if (exists) {
      const file = await storage.getFile(category, subDirectory, `${name}.${format}`);
      return { readable: file, mimeType };
      // return c.body(file as ReadableStream, HttpCode.OK, { "Content-Type": mimeType });
   }

   // File doesn't exist so we have to see if another format exists
   const { file: otherFile } = await findImageByName(category, subDirectory, name, format);

   const { readable, writable } = new TransformStream();

   await transformImage(otherFile, writable, format as ImageFormats);
   const [readable1, readable2] = readable.tee();

   return { readable: readable1, cacheReadable: readable2, mimeType };
}

export function getCacheDir(format?: string, quality?: number, width?: number, height?: number) {
   const modifiers = [];

   if (format) {
      modifiers.push(`format_${format}`);
   }
   if (quality && !Number.isNaN(quality)) {
      modifiers.push(`quality_${quality}`);
   }
   if (width && !Number.isNaN(width)) {
      modifiers.push(`width_${width}`);
   }
   if (height && !Number.isNaN(height)) {
      modifiers.push(`height_${height}`);
   }

   return modifiers.join(",");
}
