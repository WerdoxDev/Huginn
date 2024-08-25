import { Errors, HttpCode, HuginnErrorData } from "@huginn/shared";
import { H3Event, setResponseStatus } from "h3";
import { createErrorFactory, ErrorFactory } from "./error-factory";

export function createHuginnError(
   event: H3Event,
   errorFactory: ErrorFactory,
   status: HttpCode = HttpCode.BAD_REQUEST,
): HuginnErrorData {
   event.context.forcedStatus = status;
   setResponseStatus(event, status);
   return errorFactory.toObject();
}

export function notFound(event: H3Event, factory: ErrorFactory): HuginnErrorData {
   return createHuginnError(event, factory, HttpCode.NOT_FOUND);
}

export function unauthorized(event: H3Event): HuginnErrorData {
   return createHuginnError(event, createErrorFactory(Errors.unauthorized()), HttpCode.UNAUTHORIZED);
}

export function invalidFormBody(event: H3Event): HuginnErrorData {
   return createHuginnError(event, createErrorFactory(Errors.invalidFormBody()));
}

export function fileNotFound(event: H3Event): HuginnErrorData {
   return notFound(event, createErrorFactory(Errors.fileNotFound()));
}

export function invalidFileFormat(event: H3Event): HuginnErrorData {
   return createHuginnError(event, createErrorFactory(Errors.invalidFileFormat()));
}
