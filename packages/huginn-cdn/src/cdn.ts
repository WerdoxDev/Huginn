import {
   createErrorFactory,
   ErrorFactory,
   fileNotFound,
   invalidFileFormat,
   logReject,
   logRequest,
   logResponse,
   logServerError,
} from "@huginn/backend-shared";
import { Errors, generateRandomString, HttpCode, HuginnErrorData } from "@huginn/shared";
import consola from "consola";
import { colors } from "consola/utils";
import { createApp, createRouter, getResponseStatus, Router, send, setResponseHeader, setResponseStatus, toWebHandler } from "h3";
import { cdnHost, cdnPort, certFile, keyFile } from ".";
import { version } from "../package.json";
import { CDNErrorType, isCDNError } from "./error";
import { importRoutes } from "./routes";

export async function startCdn() {
   consola.info(`Using version ${version}`);
   consola.start("Starting cdn...");

   const app = createApp({
      onError(error, event) {
         const id = event.context.id;

         if (error.cause && !(error.cause instanceof Error) && typeof error.cause === "object" && "errors" in error.cause) {
            const status = getResponseStatus(event);
            logReject(event.path, event.method, id, error.cause as HuginnErrorData, status);
            return send(event, JSON.stringify(error.cause), "application/json");
         }
         if (error.statusCode === HttpCode.NOT_FOUND) {
            setResponseStatus(event, HttpCode.NOT_FOUND, "Not Found");
            logReject(event.path, event.method, id, undefined, HttpCode.NOT_FOUND);
            return send(event, `${event.path} Not Found`);
         }
         if (isCDNError(error.cause)) {
            // Common errors
            const cdnError = error.cause;
            let errorFactory: ErrorFactory | undefined;

            if (cdnError.isErrorType(CDNErrorType.FILE_NOT_FOUND)) {
               setResponseStatus(event, HttpCode.NOT_FOUND);
               errorFactory = createErrorFactory(Errors.fileNotFound());
            }
            if (cdnError.isErrorType(CDNErrorType.INVALID_FILE_FORMAT)) {
               setResponseStatus(event, HttpCode.BAD_REQUEST);
               errorFactory = createErrorFactory(Errors.invalidFileFormat());
            }

            if (errorFactory) {
               const status = getResponseStatus(event);
               logReject(event.path, event.method, id, errorFactory.toObject(), status);

               setResponseHeader(event, "content-type", "application/json");
               return send(event, JSON.stringify(errorFactory.toObject()));
            }
         }

         logServerError(event.path, error.cause as Error);
         logReject(event.path, event.method, id, "Server Error", HttpCode.SERVER_ERROR);

         setResponseStatus(event, HttpCode.SERVER_ERROR);
         return send(event, JSON.stringify(createErrorFactory(Errors.serverError()).toObject()));
      },
      onBeforeResponse(event, response) {
         if (event.method === "OPTIONS") {
            return;
         }

         const id = event.context.id;
         const status = getResponseStatus(event);

         if (status >= 200 && status < 300) {
            logResponse(event.path, status, id, response.body);
         } else {
            logReject(event.path, event.method, id, response.body as HuginnErrorData, status);
         }
      },
      onRequest(event) {
         event.context.id = generateRandomString(6);
         const id = event.context.id;
         logRequest(event.path, event.method, id, undefined);
      },
   });

   router = createRouter();

   await importRoutes();

   app.use(router);

   const handler = toWebHandler(app);

   const cdn = Bun.serve<string>({
      cert: certFile,
      key: keyFile,
      port: cdnPort,
      hostname: cdnHost,
      fetch(req) {
         return handler(req);
      },
   });

   consola.success("CDN started!");
   consola.box(`Listening on ${colors.yellow(cdn.url.href)}`);

   return { app, cdn };
}

export let router: Readonly<Router>;
