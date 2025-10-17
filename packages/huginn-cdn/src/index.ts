import consola from "consola";
import { envs } from "#setup";
import { main } from "#elysia";

Bun.serve({
   fetch: main.fetch,
   hostname: envs.CDN_HOST,
   port: envs.CDN_PORT,
   idleTimeout: 40,
});

consola.box(`Listening on ${envs.CDN_HOST}:${envs.CDN_PORT}`);
