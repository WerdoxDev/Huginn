import ffmpeg from "fluent-ffmpeg";
import sharp from "sharp";
import { verifyToken, type TokenPayload, type TokenType } from "#token-factory";
import { prisma } from "#database";
import type { UserTokenPayload } from "@huginn/shared";
import Elysia from "elysia";
import { unauthorized } from "#index";

export async function tryCatch<T>(fn: (() => Promise<T>) | (() => T)): Promise<[Error, null] | [null, T]> {
   try {
      return [null, await fn()];
   } catch (e) {
      return [e as Error, null];
   }
}

export async function getImageData(source: string | ArrayBuffer) {
   try {
      let arrayBuffer: ArrayBuffer;
      if (typeof source === "string") {
         arrayBuffer = await (await fetch(source)).arrayBuffer();
      } else {
         arrayBuffer = source;
      }

      const metadata = await sharp(arrayBuffer).metadata();
      // const newDimensions = constrainImageSize(metadata.width ?? 0, metadata.height ?? 0, maxWidth, maxHeight, true);

      return { width: metadata.width ?? 0, height: metadata.height ?? 0 };
   } catch (e) {
      console.error("Error fetching image data:", e);
      return undefined;
   }
}

export async function getVideoData(filePath: string, source: ArrayBuffer) {
   try {
      const file = Bun.file(filePath);
      await file.write(source);

      const result = await new Promise<{ width: number; height: number }>((res, rej) => {
         ffmpeg.ffprobe(filePath, (err, data) => {
            if (err) {
               rej(err);
            }

            const stream = data.streams[0];
            if (!stream) {
               rej();
            }

            res({ width: stream.width ?? 0, height: stream.height ?? 0 });
         });
      });

      await file.delete();

      return result;
   } catch (e) {
      console.log(e);
   }
}

export function verifyJwt<Type extends TokenType = "user-access">(type?: Type) {
   return new Elysia({ name: "verify-jwt" }).derive({ as: "scoped" }, async ({ headers, status }) => {
      const authorization = headers["authorization"];

      const token = authorization?.split(" ")[1];

      if (!token) {
         return unauthorized(status);
      }

      const { valid, payload } = await verifyToken(type ?? "user-access", token);

      if (!valid || !payload) {
         return unauthorized(status);
      }

      // We may have deleted the user form the db

      if ((["user-access", "user-refresh"] as TokenType[]).includes(type ?? "user-access")) {
         if (!(await prisma.user.exists({ id: BigInt((payload as UserTokenPayload).id) }))) {
            return unauthorized(status);
         }
      }

      return { token: token, tokenPayload: payload as TokenPayload<Type> };
   });
}

class GlobalElysia {
   waitUntilPromises?: (() => Promise<unknown>)[];

   waitUntil(callback: () => Promise<unknown>) {
      if (!this.waitUntilPromises) {
         this.waitUntilPromises = [callback];
      } else {
         this.waitUntilPromises.push(callback);
      }
   }
}

export const globalPlugin = new Elysia({ name: "global-plugin" }).derive({ as: "scoped" }, () => {
   return { global: new GlobalElysia() };
});
