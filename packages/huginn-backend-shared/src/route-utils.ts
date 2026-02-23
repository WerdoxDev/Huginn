import sharp from "sharp";
import { prisma } from "#database";
import { error, type UserTokenPayload } from "@huginn/shared";
import Elysia from "elysia";
import { verifyToken, type TokenPayload, type TokenType } from "#token-factory";
import { unauthorized } from "#elysia-errors";
import { ALL_FORMATS, BufferSource, Input } from "mediabunny";
import type { ImageData, VideoData } from "#types";
import { rateLimit } from "elysia-rate-limit";

export async function tryCatch<T>(fn: (() => Promise<T>) | (() => T)): Promise<[Error, null] | [null, T]> {
   try {
      return [null, await fn()];
   } catch (e) {
      return [e as Error, null];
   }
}

export async function getImageData(source: string | ArrayBuffer): Promise<ImageData | undefined> {
   try {
      let arrayBuffer: ArrayBuffer;
      if (typeof source === "string") {
         arrayBuffer = await (await fetch(source)).arrayBuffer();
      } else {
         arrayBuffer = source;
      }

      const metadata = await sharp(arrayBuffer).metadata();

      return { width: metadata.width ?? 0, height: metadata.height ?? 0 };
   } catch (e) {
      error("backend-shared:route-utils", "Getting image data failed:", e);
      return undefined;
   }
}

export async function getVideoData(source: ArrayBuffer): Promise<VideoData | undefined> {
   try {
      const input = new Input({ source: new BufferSource(source), formats: ALL_FORMATS });
      const video = await input.getPrimaryVideoTrack();

      return { width: video?.displayWidth ?? 0, height: video?.displayHeight ?? 0 };
   } catch (e) {
      error("backend-shared:route-utils", "Getting video data failed:", e);
      return undefined;
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

export function hRateLimit(options: { duration?: number; max?: number }) {
   return rateLimit({
      duration: options.duration,
      max: options.max,
      generator: (req, server) => {
         const ip = req.headers.get("x-real-ip");
         return ip ?? server?.requestIP(req)?.address ?? "";
      },
      errorResponse: new Response(JSON.stringify({ message: "You are being limited" }), {
         status: 429,
         headers: { "Content-Type": "application/json" },
      }),
      scoping: "scoped",
   });
}
