import consola from "consola";
import { ws } from "#routes/gateway";
import { envs } from "#setup";
import { main } from "#elysia";

const server = Bun.serve({
   websocket: ws.websocket,
   fetch(req, server) {
      if (req.headers.get("upgrade") === "websocket") {
         return ws.handleUpgrade(req, server);
      }

      return main.fetch(req);
   },
   hostname: envs.SERVER_HOST,
   port: envs.SERVER_PORT,
   idleTimeout: 40,
});

if (process.env.TEST) {
   console.log(`Listening on ${server.hostname}:${server.port}`);
} else {
   consola.box(`Listening on ${server.hostname}:${server.port}`);
}
