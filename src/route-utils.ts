import { Error, HttpCode } from "@shared/errors";
import Elysia, { Context, ElysiaConfig } from "elysia";
import cors from "@elysiajs/cors";
import bearer from "@elysiajs/bearer";
import { ACCESS_TOKEN_SECRET, verifyToken } from "./factory/token-factory";
import { ErrorFactory, createError } from "./factory/error-factory";
import { logServerError } from "./log-utils";
import { InferContext } from "..";

export const setup = new Elysia({ name: "setup" }).use(cors()).use(bearer());

export async function handleRequest(context: Context<{ body: never }>, requestFunction: (ctx: typeof context) => unknown) {
   try {
      return requestFunction(context);
   } catch (e) {
      return serverError(context, e);
   }
}

export function createRequest(config?: ElysiaConfig) {
   return new Elysia(config).use(setup);
}

export async function hasToken(ctx: InferContext<typeof setup>) {
   if (!ctx.bearer) {
      return unauthorized(ctx);
   }

   const [valid] = await verifyToken(ctx.bearer, ACCESS_TOKEN_SECRET);
   if (!valid) {
      return unauthorized(ctx);
   }

   return undefined;
}

export function serverError(ctx: InferContext<typeof setup>, error: unknown) {
   logServerError(ctx.path, error);

   ctx.set.status = HttpCode.SERVER_ERROR;
   return createError(Error.serverError()).toObject();
}

export function unauthorized(ctx: InferContext<typeof setup>) {
   ctx.set.status = HttpCode.UNAUTHORIZED;
   return createError(Error.unauthorized()).toObject();
}

export function error(ctx: InferContext<typeof setup>, error: ErrorFactory, code: HttpCode = HttpCode.BAD_REQUEST) {
   ctx.set.status = code;
   return error.toObject();
}

export function result(ctx: InferContext<typeof setup>, result: unknown, code: HttpCode = HttpCode.OK) {
   ctx.set.status = code;
   return result;
}
