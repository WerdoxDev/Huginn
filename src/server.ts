import { Error, HttpCode, HuginnErrorData } from "@shared/errors";
import { consola } from "consola";
import { colors } from "consola/utils";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { serverHost, serverPort } from ".";
import { createError } from "./factory/error-factory";
import { logReject, logRequest, logResponse, logServerError } from "./log-utils";
import { error, serverError, tryGetBodyJson } from "./route-utils";
import routes from "./routes/routes";
import testRoute from "./routes/test";
import { gatewayMessage, gatewayOpen } from "./gateway";

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

const server = Bun.serve({
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
      open: gatewayOpen,
      message: gatewayMessage,
   },
});

consola.success("Server started!");
consola.box(`Listening on ${colors.green(`http://${server.hostname}:${server.port}`)}`);
