import { router as serverRouter } from "@huginn/server";
import { router as cdnRouter } from "@huginn/cdn";
import {
   createApp,
   createRouter,
   defineEventHandler,
   getHeader,
   getResponseStatus,
   handleCors,
   readBody,
   send,
   setResponseHeader,
   setResponseStatus,
   toWebHandler,
   useBase,
} from "h3";
import { logReject, logServerError, createErrorFactory, logResponse, logRequest, ErrorFactory } from "@huginn/backend-shared";
import { HuginnErrorData, HttpCode, Errors, generateRandomString } from "@huginn/shared";
import { isDBError } from "@huginn/server/src/database";
import { handleCommonDBErrors } from "@huginn/server/src/utils/route-utils";
import { isCDNError } from "@huginn/cdn/src/error";
import { handleCommonCDNErrors } from "@huginn/cdn/src/utils/route-utils";
import { gateway } from "@huginn/server/src/server";

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

      // Common errors
      let errorFactory: ErrorFactory | undefined;
      if (isDBError(error.cause)) {
         errorFactory = handleCommonDBErrors(event, error.cause);
      }

      if (isCDNError(error.cause)) {
         errorFactory = handleCommonCDNErrors(event, error.cause);
      }

      if (errorFactory) {
         const status = getResponseStatus(event);
         logReject(event.path, event.method, id, errorFactory.toObject(), status);

         setResponseHeader(event, "content-type", "application/json");
         return send(event, JSON.stringify(errorFactory.toObject()));
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
      if (handleCors(event, { origin: "*", preflight: { statusCode: 204 }, methods: "*" })) {
         return;
      }
      event.context.id = generateRandomString(6);
      const id = event.context.id;
      const isFormData = getHeader(event, "Content-Type")?.includes("multipart/form-data");
      logRequest(event.path, event.method, id, event.method !== "GET" && !isFormData ? await readBody(event) : undefined);
   },
});

const router = createRouter();

router.use(
   "/**",
   defineEventHandler(async event => {
      let result = await serverRouter.handler(event);

      if (result === null) {
         return result;
      }

      if (!result) {
         result = await cdnRouter.handler(event);
      }

      return result;
   }),
);

app.use(router);

const handler = toWebHandler(app);

Bun.serve<string>({
   port: 3003,
   hostname: "192.168.178.51",
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
