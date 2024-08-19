import consola from "consola";
import { version } from "../package.json";
import { certFile, keyFile, cdnHost, cdnPort } from ".";
import { Hono } from "hono";
import { HttpCode } from "@huginn/shared";
import { colors } from "consola/utils";
import avatar from "./avatar";

export function startCdn() {
   consola.info(`Using version ${version}`);
   consola.start("Starting server...");

   const app = new Hono();

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
