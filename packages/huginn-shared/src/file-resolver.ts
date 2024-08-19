import path from "path";
import fs from "fs/promises";
import { Base64Resolvable, BufferResolvable, ResolvedFile } from "@huginn/shared";

/**
 * Resolves a base64 data url string, URL, file path, or Buffer to a base64 data url string
 */
export async function resolveImage(image: Base64Resolvable): Promise<string> {
   if (typeof image === "string" && image.startsWith("data:")) {
      return image;
   }
   const file = await resolveFile(image);
   return resolveBase64(file.data);
}

/**
 * Resolves a Buffer to a base64 data url
 */
export function resolveBase64(data: Base64Resolvable): string {
   if (Buffer.isBuffer(data)) return `data:image/png;base64,${data.toString("base64")}`;
   return data;
}

/**
 * Resolves a base64 data url string to a Buffer
 */
export function resolveBuffer(data: string): Buffer {
   const regex = /^data:.+\/(.+);base64,(.*)$/;

   const matches = data.match(regex);

   if (matches) {
      const data = matches[2];

      return Buffer.from(data, "base64");
   }

   return Buffer.from("", "base64");
}

/**
 * Resolves a Buffer, URL, file path to a Buffer
 */
export async function resolveFile(resource: BufferResolvable): Promise<ResolvedFile> {
   if (Buffer.isBuffer(resource)) return { data: resource };

   if (typeof resource[Symbol.asyncIterator as unknown as number] === "function") {
      const buffers = [];
      for await (const data of resource) buffers.push(Buffer.from(data));
      return { data: Buffer.concat(buffers) };
   }

   if (typeof resource === "string") {
      if (/^https?:\/\//.test(resource)) {
         const res = await fetch(resource);
         return { data: Buffer.from(await res.arrayBuffer()), contentType: res.headers.get("content-type") ?? undefined };
      }

      const file = path.join(__dirname, resource);

      const stats = await fs.stat(file);
      if (!stats.isFile()) throw new Error(`File was not found: ${file}`);
      return { data: await fs.readFile(file) };
   }

   throw new Error("The provided resource type was not valid");
}
