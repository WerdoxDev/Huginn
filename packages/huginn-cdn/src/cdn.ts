import consola from "consola";
import { colors } from "consola/utils";
import { Hono } from "hono";
import { cdnHost, cdnPort, certFile, keyFile } from ".";
import { version } from "../package.json";
import avatar from "./avatar";
import { cors } from "hono/cors";

export function startCdn() {
   consola.info(`Using version ${version}`);
   consola.start("Starting server...");

   const app = new Hono();

   app.use("*", cors());

   app.route("/", avatar);

   const cdn = Bun.serve<string>({
      cert: certFile,
      key: keyFile,
      port: cdnPort,
      hostname: cdnHost,
      fetch: app.fetch,
   });

   consola.success("CDN started!");
   consola.box(`Listening on ${colors.yellow(cdn.url.href)}`);

   return { app, cdn };
}
