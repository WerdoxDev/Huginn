import { Error, HttpCode, HuginnErrorData, idFix } from "@huginn/shared";
// import { colors } from "consola/utils";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { env } from "node:process";
import { version } from "../package.json";
import "./db/index";
import { createError } from "./factory/error-factory";
import { ServerGateway } from "./gateway/server-gateway";
import { hconsole, logReject, logRequest, logResponse, logServerError } from "./log-utils";
import { error, serverError, tryGetBodyJson } from "./route-utils";
import routes from "./routes/route-merger";
import testRoute from "./routes/test-routes";
import { TokenInvalidator } from "./token-invalidator";
import { prisma } from "./db/index";
import { createBunWebSocket } from "hono/bun";

export function startServer() {
   const { upgradeWebSocket, websocket } = createBunWebSocket();
   // const serverHost = env.SERVER_HOST;
   // const serverPort = env.SERVER_PORT;

   // if (!serverHost || !serverPort) {
   //    hconsole.error("Server config is not set correctly!");
   //    return;
   //    // process.exit();
   // }
   hconsole.info(`Using version ${version}`);

   hconsole.start("Starting server...");

   const app = new Hono();

   app.use("*", cors());

   app.use("*", async (c, next) => {
      if (c.req.method === "OPTIONS") {
         return;
      }

      logRequest(c.req.path, c.req.method, await tryGetBodyJson(c.req));

      await next();

      const response = c.res.clone();

      if (c.res.status >= 200 && c.res.status < 300) {
         logResponse(c.req.path, c.res.status, await tryGetBodyJson(response));
      } else if (c.res.status === 500) {
         logReject(c.req.path, c.req.method, "Server Error", c.res.status);
      } else {
         logReject(c.req.path, c.req.method, (await tryGetBodyJson(response)) as HuginnErrorData, c.res.status);
      }
   });

   app.onError((e, c) => {
      logServerError(c.req.path, e);

      if (e instanceof SyntaxError) {
         return error(c, createError(Error.malformedBody()), HttpCode.BAD_REQUEST);
      }

      // logReject(c.req.path, c.req.method, e.message);

      return serverError(c, e, false);
   });

   app.route("/", routes);
   app.route("/", testRoute);

   app.get("/", async c => {
      const users = idFix(await prisma.user.findMany());

      return c.json(users[0].avatar);
      // return c.html(
      //    '<div style="height:100%; display: flex; align-items:center; justify-content:center;"><div style="font-size: 2rem;">Huginn API Homepage</div></div>',
      // );
   });

   app.get(
      "/gateway",
      upgradeWebSocket(c => {
         return {
            onOpen: (evt, ws) => gateway.onOpen(ws),
            onClose: (evt, ws) => gateway.onClose(ws, evt),
            onMessage: (evt, ws) => gateway.onMessage(ws, message),
         };
      }),
   );

   // const server = Bun.serve<string>({
   //    cert: certFile,
   //    key: keyFile,
   //    port: serverPort,
   //    hostname: serverHost,
   //    fetch(req, server) {
   //       const url = new URL(req.url);
   //       if (url.pathname === "/gateway") {
   //          if (server.upgrade(req)) {
   //             return;
   //          }
   //          return new Response(JSON.stringify(createError(Error.websocketFail())), { status: HttpCode.BAD_REQUEST });
   //       }

   //       return app.fetch(req, server);
   //    },
   //    websocket: {
   //       open: ws => {
   //          gateway.onOpen(ws);
   //       },
   //       close: (ws, code, reason) => {
   //          gateway.onClose(ws, code, reason);
   //       },
   //       message: (ws, message) => gateway.onMessage(ws, message),
   //       sendPings: false,
   //    },
   // });

   // const server = { port: serverPort, hostname: serverHost, fetch: app.fetch };

   hconsole.success("Server started!");
   // consola.box(`Listening on ${colors.green(server.url.href)}`);
   hconsole.box(`Listening on ${hconsole.green("/* todo */")}`);

   return app;
}

export const gateway = new ServerGateway({ logHeartbeat: false });
export const tokenInvalidator = new TokenInvalidator();
