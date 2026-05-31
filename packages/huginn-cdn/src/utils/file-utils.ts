import { storage } from "#setup";
import { CDNErrorType, CDNError } from "@huginn/backend-shared";
import { type FileContentTypes, type ImageFormats, fileTypes } from "@huginn/shared";
// import { Readable, Writable } from "node:stream";
import PQueue from "p-queue";
// import sharp from "sharp";

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

/**
 * Tries to find an image with the same name but different format.
 */
export async function findImageByName(category: FileCategory, subDirectory: string, name: string, wantedFormat: string) {
   const formats = ["png", "jpeg", "jpg", "webp", "gif"];

   let foundFile;
   for (const format of formats) {
      const filename = `${name}.${format}`;

      const existingFile = await storage.getFile(category, subDirectory, filename);

      if (existingFile) {
         foundFile = {
            file: existingFile,
            info: extractFileInfo(filename),
         };
      }
   }

   if (foundFile && !formats.includes(wantedFormat)) {
      throw new CDNError("findImageByName", CDNErrorType.INVALID_FILE_FORMAT);
   }

   if (foundFile) {
      return foundFile;
   } else {
      throw new CDNError("findImageByName", CDNErrorType.FILE_NOT_FOUND);
   }
}

export async function transformImage(
   input: Blob,
   options: {
      width?: number;
      height?: number;
      quality?: number;
      format?: ImageFormats;
   },
): Promise<Blob> {
   return (await queue.add<Blob>(async () => {
      // new Bun.Image(input);
      // const arrayBuffer = input.;
      let img = new Bun.Image(input);

      if (options.format) {
         switch (options.format) {
            case "jpeg":
            case "jpg":
               img = img.jpeg({ quality: options.quality });
               break;
            case "png":
               img = img.png({ compressionLevel: options.quality ? Math.round((9 * (100 - options.quality)) / 100) : undefined });
               break;
            case "webp":
               img = img.webp({ quality: options.quality });
               break;
         }
      }

      if (options.width) {
         img = img.resize(options.width, options.height, { fit: "inside" });
      }

      return await img.blob();
   })) as Blob;
}

// function bunReadableToNode(input: ReadableStream) {
//    const reader = input.getReader();
//    const nodeReadable = new Readable({ read() {} });

//    (async () => {
//       try {
//          while (true) {
//             const { done, value } = await reader.read();
//             if (done) {
//                break;
//             }
//             nodeReadable.push(value);
//          }
//          nodeReadable.push(null);
//       } catch (err) {
//          nodeReadable.destroy(err as Error);
//       }
//    })();

//    return nodeReadable;
// }

// function bunWritableToNode(input: WritableStream) {
//    const writer = input.getWriter();

//    return new Writable({
//       async write(chunk, encoding, callback) {
//          try {
//             await writer.write(chunk);
//             callback();
//          } catch (err) {
//             callback(err as Error);
//          }
//       },
//       async final(callback) {
//          try {
//             await writer.close();
//             callback();
//          } catch (err) {
//             callback(err as Error);
//          }
//       },
//       destroy(error, callback) {
//          try {
//             if (error) {
//                writer.abort(error);
//             }
//             // oxlint-disable-next-line no-unused-vars
//          } catch (e) {}
//          callback();
//       },
//    });
// }
