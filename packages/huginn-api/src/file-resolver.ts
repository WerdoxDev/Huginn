import path from "path";
import fs from "fs/promises";
import { Base64Resolvable, BufferResolvable, ResolvedFile } from "@huginn/shared";

export async function resolveImage(image: Base64Resolvable): Promise<string | undefined> {
   if (!image) return undefined;
   if (typeof image === "string" && image.startsWith("data:")) {
      return image;
   }
   const file = await resolveFile(image);
   return resolveBase64(file.data);
}

export function resolveBase64(data: Base64Resolvable): string | undefined {
   if (Buffer.isBuffer(data)) return `data:image/png;base64,${data.toString("base64")}`;
   return data;
}

export async function resolveFile(resource: BufferResolvable): Promise<ResolvedFile> {
   if (Buffer.isBuffer(resource)) return { data: resource };

   if (typeof resource[Symbol.asyncIterator as unknown as number] === "function") {
      const buffers = [];
      for await (const data of resource) buffers.push(Buffer.from(data));
      console.log("the weird type got hit...");
      return { data: Buffer.concat(buffers) };
   }

   if (typeof resource === "string") {
      if (/^https?:\/\//.test(resource)) {
         console.log("URL type was hit");
         const res = await fetch(resource);
         return { data: Buffer.from(await res.arrayBuffer()), contentType: res.headers.get("content-type") ?? undefined };
      }

      console.log("File path was hit");

      const file = path.resolve(resource);

      const stats = await fs.stat(file);
      if (!stats.isFile()) throw new Error(`File was not found: ${file}`);
      return { data: await fs.readFile(file) };
   }

   throw new Error("The provided resource type was not valid");
}
