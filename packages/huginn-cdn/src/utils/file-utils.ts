import { Readable, Writable } from "node:stream";
import { CDNErrorType, CDNError } from "@huginn/backend-shared";
import { type FileContentTypes, type ImageFormats, fileTypes } from "@huginn/shared";
import PQueue from "p-queue";
import sharp from "sharp";
import { storage } from "#setup";
import type { FileCategory, FileInfo } from "./types";

const queue = new PQueue({ concurrency: 1 });

export function extractFileInfo(filename: string): FileInfo {
   const extensionStartIndex = filename.lastIndexOf(".");
   const extension = filename.slice(extensionStartIndex + 1);
   const name = filename.slice(0, extensionStartIndex);

   if (!Object.keys(fileTypes).some((x) => x === extension.toLowerCase())) {
      return { name, format: extension, extension, mimeType: "application/octet-stream" };
   }

   const format = extension.toLowerCase() as keyof typeof fileTypes;
   const mimeType = fileTypes[format] as FileContentTypes;

   return { name, format, extension, mimeType };
}

export async function findImageByName(category: FileCategory, subDirectory: string, name: string, wantedFormat: string) {
   const formats = ["png", "jpeg", "jpg", "webp"];

   let foundFile;
   for (const format of formats) {
      const filename = `${name}.${format}`;

      const exists = await storage.exists(category, subDirectory, filename);

      if (exists) {
         foundFile = { file: (await storage.getFile(category, subDirectory, filename)) as ReadableStream, info: extractFileInfo(filename) };
      }
   }

   if (foundFile && !formats.includes(wantedFormat)) {
      throw new CDNError("findImageByName", CDNErrorType.INVALID_FILE_FORMAT);
   }

   if (foundFile) {
      return foundFile;
   }

   throw new CDNError("findImageByName", CDNErrorType.FILE_NOT_FOUND);
}

export async function transformImage(
   input: ReadableStream,
   output: WritableStream,
   format?: ImageFormats,
   quality?: number,
   width?: number,
   height?: number,
): Promise<void> {
   return await queue.add(() => {
      const nodeWritable = bunWritableToNode(output);
      const nodeReadable = bunReadableToNode(input);

      let sharpInstance = sharp();
      if ((width && !Number.isNaN(width)) || (height && !Number.isNaN(height))) {
         sharpInstance = sharpInstance.resize({ width, height });
      }

      if (format) {
         sharpInstance = sharpInstance.toFormat(format, {
            lossless: !quality || quality === 100,
            quality: quality !== 100 && !Number.isNaN(quality) ? quality : undefined,
         });
      }

      nodeReadable.pipe(sharpInstance).pipe(nodeWritable);
   });
}

function bunReadableToNode(input: ReadableStream) {
   const reader = input.getReader();
   const nodeReadable = new Readable({ read() {} });

   (async () => {
      try {
         while (true) {
            const { done, value } = await reader.read();
            if (done) {
               break;
            }
            nodeReadable.push(value);
         }
         nodeReadable.push(null);
      } catch (err) {
         nodeReadable.destroy(err as Error);
      }
   })();

   return nodeReadable;
}

function bunWritableToNode(input: WritableStream) {
   const writer = input.getWriter();

   return new Writable({
      async write(chunk, encoding, callback) {
         try {
            await writer.write(chunk);
            callback();
         } catch (err) {
            callback(err as Error);
         }
      },
      async final(callback) {
         try {
            await writer.close();
            callback();
         } catch (err) {
            callback(err as Error);
         }
      },
      destroy(error, callback) {
         try {
            if (error) {
               writer.abort(error);
            }
            // oxlint-disable-next-line no-unused-vars
         } catch (e) {}
         callback();
      },
   });
}
