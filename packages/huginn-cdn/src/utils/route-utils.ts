import type { Context } from "elysia";

import { singleError } from "@huginn/backend-shared";
import { CONSTANTS, Errors, type ImageFormats } from "@huginnjs/shared";
import sharp from "sharp";

import type { FileCategory } from "#utils/types";

import { storage } from "#server";

import { extractFileInfo, findImageByName, transformImage } from "./file-utils";

export async function tryResolveImage(
   category: FileCategory,
   subDirectory: string,
   imageName: string,
   options?: { width?: number; height?: number; quality?: number; format?: ImageFormats },
) {
   const { name, format, extension } = extractFileInfo(imageName);
   if (!options?.format) options = { ...options, format: format as ImageFormats };

   const key = getCacheKey(name, format, options);
   const existingFile = await storage.getFile(category, subDirectory, key);

   // Best scenario, file already exists and ready to serve
   if (existingFile) {
      return { file: new Blob([existingFile]), transformation: undefined };
   }

   // console.log(otherFile.name);
   // File/transformation doesn't exist so we have to see if another format exists
   const { file: otherFile } = await findImageByName(category, subDirectory, name, format, extension);

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

// Decode and re-encode uploads rather than trusting file names or MIME types.
// Animated WebP retains both GIF animation and transparent backgrounds.
export async function prepareStickerImage(input: Blob, status: Context["status"]) {
   if (input.size > CONSTANTS.STICKER_MAX_BYTES) return singleError(Errors.fileTooLarge(input.size, CONSTANTS.STICKER_MAX_BYTES), status, "Bad Request");
   if (!input.size) return singleError(Errors.invalidFileFormat(), status, "Bad Request");

   try {
      const image = sharp(Buffer.from(await input.arrayBuffer()), { animated: true, limitInputPixels: 40_000_000 });
      const metadata = await image.metadata();
      if (!metadata.format || !CONSTANTS.ALLOWED_STICKER_FORMATS.includes(metadata.format)) {
         return singleError(Errors.invalidFileFormat(), status, "Bad Request");
      }
      const frames = metadata.pages ?? 1;
      const height = metadata.pageHeight ?? metadata.height ?? 0;
      if (!metadata.width || !height || metadata.width * height * frames > 40_000_000 || frames > 300) {
         return singleError(Errors.invalidFileFormat(), status, "Bad Request");
      }

      const { data, info } = await image
         .rotate()
         .resize({ width: 512, height: 512, fit: "inside", withoutEnlargement: true })
         .webp({ quality: 85, effort: 3 })
         .toBuffer({ resolveWithObject: true });
      if (data.byteLength > CONSTANTS.STICKER_MAX_BYTES)
         return singleError(Errors.fileTooLarge(data.byteLength, CONSTANTS.STICKER_MAX_BYTES), status, "Bad Request");

      return {
         file: new Blob([new Uint8Array(data)], { type: "image/webp" }),
         width: info.width,
         height: info.pageHeight ?? info.height,
      };
   } catch {
      return singleError(Errors.invalidFileFormat(), status, "Bad Request");
   }
}
