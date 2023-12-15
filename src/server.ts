import { HuginnErrorData } from "@shared/errors";
import { consola } from "consola";
import { colors } from "consola/utils";
import { Hono } from "hono";
import { serverHost, serverPort } from ".";
import { logReject, logRequest, logResponse, logServerError } from "./log-utils";
import { tryGetBodyJson } from "./route-utils";
import routes from "./routes/routes";
import testRoute from "./routes/test";

consola.start("Starting server...");

const app = new Hono();

app.use("*", async (c, next) => {
   logRequest(c.req.path, c.req.method, await tryGetBodyJson(c.req));

   await next();

   const response = c.res.clone();

   if (c.res.status >= 200 && c.res.status < 300) {
      logResponse(c.req.path, c.res.status, await tryGetBodyJson(response));
   } else if (c.res.status === 500) {
      logReject(c.req.path, c.req.method, undefined, c.res.status);
   } else {
      logReject(c.req.path, c.req.method, (await tryGetBodyJson(response)) as HuginnErrorData, c.res.status);
   }
});

app.onError((e, c) => {
   logServerError(c.req.path, e);

   // if (e instanceof HTTPException) {
   //    return e.getResponse();
   // }

   logReject(c.req.path, c.req.method, e.message);

   return c.text("GOT FUCKED!");
});

app.route("/", routes);
app.route("/", testRoute);

const server = Bun.serve({ port: serverPort, hostname: serverHost, fetch: app.fetch });

consola.success("Server started!");
consola.box(`Listening on ${colors.green(`http://${server.hostname}:${server.port}`)}`);
