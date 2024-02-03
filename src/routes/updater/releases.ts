import { Hono } from "hono";
import { serveStatic } from "hono/bun";

const app = new Hono();

app.get("/releases/*", serveStatic({ root: "./" }));

export default app;
