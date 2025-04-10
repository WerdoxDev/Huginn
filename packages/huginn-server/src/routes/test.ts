import { createRoute } from "@huginn/backend-shared";
import { serveStatic } from "hono/bun";
import { app } from "#index";

console.log("hi?");
// createRoute("GET", "api/check-update/win/:version", serveStatic({ root: "./" }));
