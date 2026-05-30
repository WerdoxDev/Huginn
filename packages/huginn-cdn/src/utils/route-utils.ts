import type { FileCategory } from "#utils/types";

import { storage } from "#setup";
import { type ImageFormats } from "@huginn/shared";

import { extractFileInfo, findImageByName, transformImage } from "./file-utils";

export async function tryResolveImage(
   category: FileCategory,
   subDirectory: string,
   imageName: string,
   options?: { width?: number; height?: number; quality?: number; format?: ImageFormats },
) {
   const { name, format } = extractFileInfo(imageName);
   if (!options?.format) options = { ...options, format: format as ImageFormats };

   const key = getCacheKey(name, format, options);
   const existingFile = await storage.getFile(category, subDirectory, key);

   // Best scenario, file already exists and ready to serve
   if (existingFile) {
      return { file: new Blob([existingFile]), transformation: undefined };
   }

   // console.log(otherFile.name);
   // File/transformation doesn't exist so we have to see if another format exists
   const { file: otherFile } = await findImageByName(category, subDirectory, name, format);

   const transformedFile = await transformImage(otherFile, options ?? {});
   return { file: transformedFile, transformation: { key } };
}

export function getCacheKey(name: string, format: string, options?: { width?: number; height?: number; quality?: number; format?: ImageFormats }) {
   const keys = [];

   keys.push(name);

   if (options && options.width) {
      keys.push(`w${options.width}`);
   }
   if (options && options.height) {
      keys.push(`h${options.height}`);
   }
   if (options && options.quality) {
      keys.push(`q${options.quality}`);
   }

   return keys.join("_") + `.${format}`;
}
