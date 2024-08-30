import { DBErrorType, isDBError } from "@database";
import { createErrorFactory, ErrorFactory, logReject, logRequest, logResponse, logServerError } from "@huginn/backend-shared";
import { Errors, generateRandomString, HttpCode, HuginnErrorData } from "@huginn/shared";
import { TokenInvalidator } from "@utils/token-invalidator";
import consola from "consola";
import { colors } from "consola/utils";
import {
   createApp,
   createRouter,
   defineEventHandler,
   getResponseStatus,
   readBody,
   Router,
   send,
   setResponseHeader,
   setResponseStatus,
   toWebHandler,
   useBase,
} from "h3";
import { certFile, keyFile, serverHost, serverPort } from ".";
import { version } from "../package.json";
import { ServerGateway } from "./gateway/server-gateway";
import { importRoutes } from "./routes";

export async function startServer() {
   consola.info(`Using version ${version}`);
   consola.start("Starting server...");

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
         if (isDBError(error.cause)) {
            // Common errors
            const dbError = error.cause;
            setResponseHeader(event, "content-type", "application/json");
            let errorFactory: ErrorFactory | undefined;
            if (error.cause.isErrorType(DBErrorType.INVALID_ID)) {
               setResponseStatus(event, HttpCode.BAD_REQUEST);
               errorFactory = createErrorFactory(Errors.invalidFormBody());
            }
            if (error.cause.isErrorType(DBErrorType.NULL_USER)) {
               setResponseStatus(event, HttpCode.NOT_FOUND);
               errorFactory = createErrorFactory(Errors.unknownUser(dbError.cause));
            }
            if (error.cause.isErrorType(DBErrorType.NULL_RELATIONSHIP)) {
               setResponseStatus(event, HttpCode.NOT_FOUND);
               errorFactory = createErrorFactory(Errors.unknownRelationship(dbError.cause));
            }
            if (error.cause.isErrorType(DBErrorType.NULL_CHANNEL)) {
               setResponseStatus(event, HttpCode.NOT_FOUND);
               errorFactory = createErrorFactory(Errors.unknownChannel(dbError.cause));
            }
            if (error.cause.isErrorType(DBErrorType.NULL_MESSAGE)) {
               setResponseStatus(event, HttpCode.NOT_FOUND);
               errorFactory = createErrorFactory(Errors.unknownMessage(dbError.cause));
            }
            if (errorFactory) {
               const status = getResponseStatus(event);
               logReject(event.path, event.method, id, errorFactory.toObject(), status);
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
      async onRequest(event) {
         event.context.id = generateRandomString(6);
         const id = event.context.id;
         logRequest(event.path, event.method, id, event.method !== "GET" ? await readBody(event) : undefined);
      },
   });

   const mainRouter = createRouter();
   router = createRouter();

   await importRoutes();

   mainRouter.get(
      "/",
      defineEventHandler(() => {
         return '<div style="height:100%; display: flex; align-items:center; justify-content:center;"><div style="font-size: 2rem;">Huginn API Homepage</div></div>';
      }),
   );

   mainRouter.use("/api/**", useBase("/api", router.handler));
   app.use(mainRouter);

   const handler = toWebHandler(app);

   const server = Bun.serve<string>({
      cert: certFile,
      key: keyFile,
      port: serverPort,
      hostname: serverHost,
      fetch(req, server) {
         const url = new URL(req.url);
         if (url.pathname === "/gateway") {
            if (server.upgrade(req)) {
               return;
            }
            return new Response(JSON.stringify(createErrorFactory(Errors.websocketFail())), { status: HttpCode.BAD_REQUEST });
         }

         return handler(req);
      },
      websocket: {
         open: ws => {
            gateway.onOpen(ws);
         },
         close: (ws, code, reason) => {
            gateway.onClose(ws, code, reason);
         },
         message: (ws, message) => gateway.onMessage(ws, message),
         sendPings: false,
      },
   });

   consola.success("Server started!");
   consola.box(`Listening on ${colors.green(server.url.href)}`);

   return server;
}

export const gateway = new ServerGateway({ logHeartbeat: false });
export const tokenInvalidator = new TokenInvalidator();
export let router: Readonly<Router>;
