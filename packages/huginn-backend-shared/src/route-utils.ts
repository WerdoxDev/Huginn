import { getCurrentSpan } from "@elysia/opentelemetry";
import { error, type OAuthTokenPayload, type UserTokenPayload } from "@huginn/shared";
import Elysia from "elysia";
import { rateLimit } from "elysia-rate-limit";
import { ALL_FORMATS, BufferSource, Input } from "mediabunny";

import type { ImageData, VideoData } from "#types";

import { unauthorized } from "#elysia-errors";
import { verifyToken, type TokenPayload, type TokenType } from "#token-factory";

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

      const metadata = await new Bun.Image(arrayBuffer).metadata();

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

      return { width: (await video?.getDisplayWidth()) ?? 0, height: (await video?.getDisplayHeight()) ?? 0 };
   } catch (e) {
      error("backend-shared:route-utils", "Getting video data failed:", e);
      return undefined;
   }
}

export function verifyJwt<Type extends TokenType = "user-access">(type?: Type) {
   return new Elysia({ name: "verify-jwt" }).derive({ as: "scoped" }, async function verifyJwt({ headers, status }) {
      const tokenType = type ?? "user-access";
      const authorization = headers["authorization"];

      const token = authorization?.split(" ")[1];

      if (!token) {
         return unauthorized(status);
      }

      const { valid, payload } = await verifyToken(tokenType, token);

      if (!valid || !payload) {
         return unauthorized(status);
      }

      const span = getCurrentSpan();
      span?.setAttributes({ "token.type": tokenType });
      if (tokenType) {
         const data = payload as UserTokenPayload;
         span?.setAttributes({
            "user.id": data.id,
            "user.auth_type": data.authType,
            "user.last_authenticated": data.lastAuthenticatedAt,
            distinct_id: data.id,
         });
      } else if (tokenType === "oauth") {
         const data = payload as OAuthTokenPayload;
         span?.setAttributes({
            "oauth.provider_id": data.providerId,
            "oauth.user_id": data.providerUserId,
            "oauth.username": data.username,
         });
         if (data.avatarHash) span?.setAttributes({ "oauth.avatar_hash": data.avatarHash });
      }

      // We may have deleted the user form the db

      // if ((["user-access", "user-refresh"] as TokenType[]).includes(type ?? "user-access")) {
      //    if (!(await prisma.user.exists({ id: BigInt((payload as UserTokenPayload).id) }))) {
      //       return unauthorized(status);
      //    }
      // }

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

export const globalPlugin = new Elysia({ name: "global-plugin" }).derive({ as: "scoped" }, function globalPlugin() {
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
