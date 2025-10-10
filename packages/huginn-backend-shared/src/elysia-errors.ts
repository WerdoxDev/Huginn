import { createErrorFactory, type ErrorFactory } from "#error-factory";
import { isDBError } from "#errors";
import { DBErrorType } from "#types";
import { Errors, JsonCode, type HuginnErrorData } from "@huginn/shared";
import type { Context, ElysiaCustomStatusResponse, InvertedStatusMap, StatusMap } from "elysia";

export function createHuginnError<Code extends keyof InvertedStatusMap | keyof StatusMap = "Bad Request">(
   errorFactory: ErrorFactory,
   status: Context["status"],
   code?: Code,
) {
   return status(code ?? "Bad Request", errorFactory.toObject()) as ElysiaCustomStatusResponse<Code, HuginnErrorData>;
}

export function serverError(status: Context["status"]) {
   return createHuginnError(createErrorFactory(Errors.serverError()), status, "Internal Server Error");
}

export function invalidBody(status: Context["status"]) {
   return createHuginnError(createErrorFactory(Errors.invalidFormBody()), status, "Bad Request");
}

export function unauthorized(status: Context["status"]) {
   return createHuginnError(createErrorFactory(Errors.unauthorized()), status, "Unauthorized");
}

export function missingAccess(status: Context["status"]) {
   return createHuginnError(createErrorFactory(Errors.missingAccess()), status, "Forbidden");
}

export function missingPermission(status: Context["status"]) {
   return createHuginnError(createErrorFactory(Errors.missingPermission()), status, "Forbidden");
}

export function notFound(status: Context["status"]) {
   return status("Not Found", "Not Found");
}

export function forbidden(status: Context["status"]) {
   return createHuginnError(createErrorFactory(Errors.forbidden()), status, "Forbidden");
}

export function singleError<Code extends keyof InvertedStatusMap | keyof StatusMap = "OK">(
   error: [string, JsonCode],
   status: Context["status"],
   code?: Code,
) {
   return createHuginnError(createErrorFactory(error), status, code ?? "OK") as ElysiaCustomStatusResponse<Code, HuginnErrorData>;
}

export function serverOnError(error: Readonly<Error>, status: Context["status"]) {
   if (!isDBError(error)) return;

   if (error.isErrorType(DBErrorType.INVALID_ID)) {
      return createHuginnError(createErrorFactory(Errors.invalidId(error.cause)), status, "Bad Request");
   }
   if (error.isErrorType(DBErrorType.NULL_USER)) {
      return createHuginnError(createErrorFactory(Errors.unknownUser(error.cause)), status, "Not Found");
   }
   if (error.isErrorType(DBErrorType.NULL_RELATIONSHIP)) {
      return createHuginnError(createErrorFactory(Errors.unknownRelationship(error.cause)), status, "Not Found");
   }
   if (error.isErrorType(DBErrorType.NULL_CHANNEL)) {
      return createHuginnError(createErrorFactory(Errors.unknownChannel(error.cause)), status, "Not Found");
   }
   if (error.isErrorType(DBErrorType.NULL_MESSAGE)) {
      return createHuginnError(createErrorFactory(Errors.unknownMessage(error.cause)), status, "Not Found");
   }

   return;
}
