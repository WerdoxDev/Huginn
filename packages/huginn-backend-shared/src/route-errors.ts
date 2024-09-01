import { Error as HError, HttpCode } from "@huginn/shared";
import { Context } from "hono";
import { createError, ErrorFactory } from "./error-factory";
import { logServerError } from "./log-utils";

export function errorResponse(c: Context, factory: ErrorFactory, code: HttpCode = HttpCode.BAD_REQUEST): Response {
   return c.json(factory.toObject(), code);
}

export function notFound(c: Context, factory: ErrorFactory): Response {
   return errorResponse(c, factory, HttpCode.NOT_FOUND);
}

export function serverError(c: Context, e: unknown, log = true): Response {
   if (log) {
      logServerError(c.req.path, e);
   }

   return errorResponse(c, createError(HError.serverError()), HttpCode.SERVER_ERROR);
}

export function unauthorized(c: Context): Response {
   return errorResponse(c, createError(HError.unauthorized()), HttpCode.UNAUTHORIZED);
}

export function invalidFormBody(c: Context): Response {
   return errorResponse(c, createError(HError.invalidFormBody()));
}

export function fileNotFound(c: Context): Response {
   return notFound(c, createError(HError.fileNotFound()));
}

export function invalidFileFormat(c: Context): Response {
   return errorResponse(c, createError(HError.invalidFileFormat()));
}
