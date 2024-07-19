import { Error, HttpCode, HuginnErrorData } from "@shared/errors";
import { consola } from "consola";
import { colors } from "consola/utils";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { serverHost, serverPort } from ".";
import { createError } from "./factory/error-factory";
import { ServerGateway } from "./gateway/server-gateway";
import { logReject, logRequest, logResponse, logServerError } from "./log-utils";
import { error, serverError, tryGetBodyJson } from "./route-utils";
import routes from "./routes/route-merger";
import testRoute from "./routes/test-routes";
import { TokenInvalidator } from "./token-invalidator";
import "./db/index";

consola.start("Starting server...");

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

export const gateway = new ServerGateway({ logHeartbeat: false });
export const tokenInvalidator = new TokenInvalidator();

export const server = Bun.serve<string>({
   port: serverPort,
   hostname: serverHost,
   fetch(req, server) {
      const url = new URL(req.url);
      if (url.pathname === "/gateway") {
         if (server.upgrade(req)) {
            return;
         }
         return new Response(JSON.stringify(createError(Error.websocketFail())), { status: HttpCode.BAD_REQUEST });
      }

      return app.fetch(req, server);
   },
   websocket: {
      open: ws => gateway.onOpen(ws),
      close: (ws, code, reason) => gateway.onClose(ws, code, reason),
      message: (ws, message) => gateway.onMessage(ws, message),
      sendPings: false,
   },
});

consola.success("Server started!");
consola.box(`Listening on ${colors.green(`http://${server.hostname}:${server.port}`)}`);
