import { Server, Errorlike } from "bun";
import { WebSocketData } from "$shared/types";
import { handleClose, handleMessage, handleOpen } from "./websocket-handler.ts";
import handleLogin from "./auth/login.ts";
import handleRegister from "./auth/register.ts";
import { createMiddleware } from "./middleware-factory.ts";

let server: Server;

export function startServer(hostname: string, port: number): void {
   server = Bun.serve<WebSocketData>({
      hostname,
      port,

      fetch(req, server) {
         return handleRequest(req, server);
      },

      error(error) {
         return handleError(error);
      },

      websocket: {
         message(ws, message) {
            handleMessage(ws, message);
         },
         open(ws) {
            handleOpen(ws);
         },
         close(ws, code, message) {
            handleClose(ws, code, message);
         },
      },
   });

   console.log(`Listening on http://${server.hostname}:${server.port} ...`);
}

async function handleRequest(req: Request, server: Server) {
   const url = new URL(req.url);

   if (url.pathname === "/") {
      return new Response("Home page!");
   }

   if (url.pathname === "/gateway") {
      return upgradeConnectionToWebsocket(req, server);
   }

   if (url.pathname.includes("/auth")) {
      return handleAuthRequest(url, req, server);
   }

   return notFound();
}

async function handleAuthRequest(url: URL, req: Request, _server: Server): Promise<Response> {
   if (url.pathname.includes("/auth/login")) {
      return createMiddleware(req)
         .method("POST")
         .body()
         .run(() => handleLogin(req));
   }

   if (url.pathname.includes("/auth/register")) {
      return createMiddleware(req)
         .method("POST")
         .body()
         .run(() => handleRegister(req));
   }

   return notFound();
}

function notFound(): Promise<Response> {
   return new Promise((resolve) => resolve(new Response("Page was not found :(", { status: 404 })));
}

function handleError(error: Errorlike) {
   return new Response(`<pre>${error}\n${error.stack}</pre>`, {
      headers: {
         "Content-Type": "text/html",
      },
   });
}

function upgradeConnectionToWebsocket(_req: Request, _server: Server): Response {
   // const data: WebSocketData = {
   //    id: getRandomId(),
   // };

   // if (!server.upgrade(req, { data })) {
   //    return new Response("Upgrade failed :(", { status: 500 });
   // }

   return new Response("Not implemented yet!");
}
