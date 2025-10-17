import { zValidator } from "@hono/zod-validator";
import ffmpeg from "fluent-ffmpeg";
import type { Context, Hono, ValidationTargets } from "hono";
import type { OnHandlerInterface } from "hono/types";
import { createMiddleware } from "hono/factory";
import sharp from "sharp";
import type { ZodSchema } from "zod";
import { invalidFormBody, notFound, unauthorized } from "./errors";
import { verifyToken, type TokenPayload, type TokenType } from "#token-factory";
import { prisma } from "#database";
import type { UserTokenPayload, OAuthTokenPayload } from "@huginn/shared";
import Elysia from "elysia";
import { elysia } from "#index";

let appInstance: Hono;

export function setAppInstance(app: Hono): void {
   appInstance = app;
}

export function getAppInstance(): Hono {
   return appInstance;
}

// @ts-ignore
const createRoute: OnHandlerInterface = (method, path: string, ...handlers) => {
   appInstance.on(method, path, ...handlers);
};

export { createRoute };

export function verifyJwt(type: TokenType = "user-access") {
   return createMiddleware(async (c, next) => {
      const bearer = c.req.header("Authorization");

      if (!bearer) {
         return unauthorized(c);
      }

      const token = bearer.split(" ")[1];

      const { valid, payload } = await verifyToken(type, token);

      if (!valid || !payload) {
         return unauthorized(c);
      }

      // We may have deleted the user form the db
      if ((["user-access", "user-refresh"] as TokenType[]).includes(type)) {
         if (!(await prisma.user.exists({ id: BigInt((payload as UserTokenPayload).id) }))) {
            return unauthorized(c);
         }
      }

      c.set("token", token);

      if (type === "oauth") {
         c.set("oauthTokenPayload", payload as unknown as OAuthTokenPayload);
      } else if (type === "user-access") {
         c.set("tokenPayload", payload as unknown as UserTokenPayload);
      }

      await next();
   });
}

// @ts-ignore
export function validator<T extends keyof ValidationTargets, S extends ZodSchema>(target: T, schema: S) {
   return zValidator(target, schema, (result, c) => {
      if (!result.success) {
         return target === "json" ? invalidFormBody(c) : notFound(c);
      }
   });
}

export async function tryCatch<T>(fn: (() => Promise<T>) | (() => T)): Promise<[Error, null] | [null, T]> {
   try {
      return [null, await fn()];
   } catch (e) {
      return [e as Error, null];
   }
}

export function waitUntil(c: Context, callback: () => Promise<unknown>) {
   let promises = c.get("waitUntilPromises");
   if (!promises) {
      promises = [callback];
   } else {
      promises.push(callback);
   }

   c.set("waitUntilPromises", promises);
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

export function verifyJwt2<Type extends TokenType = "user-access">(type?: Type) {
   return new Elysia({ name: "verify-jwt" }).derive({ as: "scoped" }, async ({ headers, status }) => {
      const authorization = headers["authorization"];

      const token = authorization?.split(" ")[1];

      if (!token) {
         return elysia.unauthorized(status);
      }

      const { valid, payload } = await verifyToken(type ?? "user-access", token);

      if (!valid || !payload) {
         return elysia.unauthorized(status);
      }

      // We may have deleted the user form the db

      if ((["user-access", "user-refresh"] as TokenType[]).includes(type ?? "user-access")) {
         if (!(await prisma.user.exists({ id: BigInt((payload as UserTokenPayload).id) }))) {
            return elysia.unauthorized(status);
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
