import { Error, HttpCode } from "@shared/errors";
import Elysia from "elysia";
import { InferContext } from "..";
import cors from "@elysiajs/cors";
import bearer from "@elysiajs/bearer";
import { ACCESS_TOKEN_SECRET, verifyToken } from "./factory/token-factory";
import { ErrorFactory, createError } from "./factory/error-factory";
import { logServerError } from "./log-utils";

export const setup = new Elysia({ name: "setup" }).use(cors()).use(bearer());

export async function hasToken(ctx: InferContext<typeof setup>) {
   if (!ctx.bearer) {
      return returnUnauthorized(ctx);
   }

   const [valid] = await verifyToken(ctx.bearer, ACCESS_TOKEN_SECRET);
   if (!valid) {
      return returnUnauthorized(ctx);
   }

   return undefined;
}

export function logAndReturnError(ctx: InferContext<typeof setup>, error: unknown) {
   logServerError(ctx.path, error);

   ctx.set.status = HttpCode.SERVER_ERROR;
   return createError(Error.serverError()).toObject();
}

export function returnUnauthorized(ctx: InferContext<typeof setup>) {
   ctx.set.status = HttpCode.UNAUTHORIZED;
   return createError(Error.unauthorized()).toObject();
}

export function returnError(ctx: InferContext<typeof setup>, error: ErrorFactory, code: HttpCode = HttpCode.BAD_REQUEST) {
   ctx.set.status = code;
   return error.toObject();
}

export function returnResult(ctx: InferContext<typeof setup>, result: unknown, code: HttpCode = HttpCode.OK) {
   ctx.set.status = code;
   return result;
}
