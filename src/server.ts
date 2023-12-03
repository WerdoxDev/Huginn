import Elysia from "elysia";
import authRoutes from "./routes/auth/index";
import userRoutes from "./routes/user/index";
import uniqueUsernameRoute from "./routes/unique-username";
import { Error, HttpCode } from "@shared/errors";
import { createError } from "./factory/error-factory";
import { setup } from "./route-utils";

let app: Elysia;

export function startServer(hostname: string, port: number) {
   app = new Elysia().use(setup).use(authRoutes).use(userRoutes).use(uniqueUsernameRoute);

   app.onError(({ code, error }) => {
      if (code === "VALIDATION") {
         return createError(Error.invalidFormBody()).toResponse(HttpCode.BAD_REQUEST);
      }

      return error;
   });

   app.listen({ hostname, port });

   console.log(`Listening on http://${app.server?.hostname}:${app.server?.port} ...`);
}
