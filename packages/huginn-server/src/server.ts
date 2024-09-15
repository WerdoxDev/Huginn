import { isDBError } from "#database/error";
import { ServerGateway } from "#gateway/server-gateway";
import { importRoutes } from "#routes";
import { AWS_KEY_ID, AWS_REGION, AWS_SECRET_KEY, CERT_FILE, GITHUB_TOKEN, KEY_FILE, SERVER_HOST, SERVER_PORT } from "#setup";
import { handleCommonDBErrors } from "#utils/route-utils";
import { TokenInvalidator } from "#utils/token-invalidator";
import { createErrorFactory, ErrorFactory, logReject, logRequest, logResponse, logServerError } from "@huginn/backend-shared";
import { Errors, generateRandomString, HttpCode, HuginnErrorData } from "@huginn/shared";
import { Server } from "bun";
import consola from "consola";
import { colors } from "consola/utils";
import {
   App,
   createApp,
   createRouter,
   defineEventHandler,
   getResponseStatus,
   handleCors,
   readBody,
   Router,
   send,
   setResponseHeader,
   setResponseStatus,
   toWebHandler,
   useBase,
} from "h3";
import { Octokit } from "octokit";
import { version } from "../package.json";
import { S3Client } from "@aws-sdk/client-s3";

export async function startServer(options?: { serve: boolean }): Promise<{ server?: Server; app: App; router: Router }> {
   consola.info(`Using version ${version}`);
   consola.start("Starting server...");

   const app = createApp({
      onError: options?.serve
         ? (error, event) => {
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
           }
         : undefined,
      onBeforeResponse: options?.serve
         ? (event, response) => {
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
           }
         : undefined,
      onRequest: options?.serve
         ? async event => {
              if (handleCors(event, { origin: "*", preflight: { statusCode: 204 }, methods: "*" })) {
                 return;
              }
              event.context.id = generateRandomString(6);
              const id = event.context.id;
              logRequest(event.path, event.method, id, event.method !== "GET" ? await readBody(event) : undefined);
           }
         : undefined,
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

   if (!options?.serve) {
      return { app, router: mainRouter };
   }

   const handler = toWebHandler(app);
   app.use(mainRouter);

   const server = Bun.serve<string>({
      cert: CERT_FILE,
      key: KEY_FILE,
      port: SERVER_PORT,
      hostname: SERVER_HOST,
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

   return { server, app, router: mainRouter };
}

export const gateway = new ServerGateway({ logHeartbeat: false });
export const tokenInvalidator = new TokenInvalidator();
export const octokit = new Octokit({ auth: GITHUB_TOKEN });
export const s3 = new S3Client({
   region: AWS_REGION,
   credentials: { accessKeyId: AWS_KEY_ID ?? "", secretAccessKey: AWS_SECRET_KEY ?? "" },
});
export let router: Readonly<Router>;
