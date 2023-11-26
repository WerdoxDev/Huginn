import Elysia from "elysia";
import authRoutes from "./routes/auth/index";
import uniqueUsernameRoute from "./routes/unique-username";
import { Error, HttpCode } from "$shared/errors";
import { createError } from "./factory/error-factory";
import cors from "@elysiajs/cors";

let app: Elysia;

export function startServer(hostname: string, port: number) {
   app = new Elysia().use(cors()).use(authRoutes).use(uniqueUsernameRoute);

   app.onError(({ code, error }) => {
      if (code === "VALIDATION") {
         return createError(Error.invalidFormBody()).toResponse(HttpCode.BAD_REQUEST);
      }

      return error;
   });

   app.listen({ hostname, port });

   console.log(`Listening on http://${app.server?.hostname}:${app.server?.port} ...`);
}
