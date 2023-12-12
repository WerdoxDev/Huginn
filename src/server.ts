import Elysia from "elysia";
import authRoutes from "./routes/auth";
import userRoutes from "./routes/user";
import channelRoutes from "./routes/channel";
import uniqueUsernameRoute from "./routes/unique-username";
import testRoute from "./routes/test";
import { Error, HuginnErrorData } from "@shared/errors";
import { createError } from "./factory/error-factory";
import { returnError, setup } from "./route-utils";
import { consola } from "consola";
import { colors } from "consola/utils";
import { logReject, logRequest, logResponse, logServerError } from "./log-utils";
import { serverHost, serverPort } from ".";

consola.start("Starting server...");

const app = new Elysia()
   .onBeforeHandle(({ request, path, body }) => {
      if (request.method !== "OPTIONS") {
         logRequest(path, request.method, body);
      }
   })
   .onAfterHandle(({ request, path, response, set }) => {
      if (request.method === "OPTIONS") {
         return;
      }

      if (!set.status || typeof set.status === "string") {
         return;
      }

      if (set.status >= 200 && set.status < 300) {
         logResponse(path, set.status, response);
      } else if (set.status === 500) {
         logReject(path, request.method, undefined, set.status);
      } else {
         logReject(path, request.method, response as HuginnErrorData, set.status);
      }
   })
   .onError((ctx) => {
      if (ctx.code === "UNKNOWN") {
         logServerError(ctx.path, ctx.error);
         return ctx.error;
      }

      logReject(ctx.path, ctx.request.method, ctx.code);

      if (ctx.code === "VALIDATION") {
         return returnError(ctx, createError(Error.invalidFormBody()));
      }

      return ctx.error;
   })
   .get("/test", () => {
      return "HELLO";
   })
   .use(setup)
   .use(authRoutes)
   .use(userRoutes)
   .use(uniqueUsernameRoute)
   .use(channelRoutes)
   .use(testRoute)
   .listen({ hostname: serverHost, port: serverPort });

consola.success("Server started!");
consola.box(`Listening on ${colors.green(`http://${app.server?.hostname}:${app.server?.port}`)}`);

export type AppType = typeof app;
