import { Error } from "$shared/errors";
import { HttpCode } from "$shared/errors";
import { createError } from "./error-factory";

class Middleware {
   private req: Request;

   private results: Record<string, { value: boolean; response: () => Response }> = {};

   constructor(req: Request) {
      this.req = req;
   }

   addResult(name: string, value: boolean, response: () => Response) {
      this.results[name] = { value, response };
   }

   method(expectedMethod: string) {
      this.addResult("method", this.req.method === expectedMethod, methodResponse);
      return this;
   }

   body() {
      this.addResult("body", this.req.body !== null, bodyResponse);
      return this;
   }

   run(handler: () => Promise<Response>): Promise<Response> {
      for (const result in this.results) {
         if (!this.results[result].value) {
            return new Promise((resolve) => resolve(this.results[result].response()));
         }
      }

      return handler();
   }
}

export function createMiddleware(req: Request) {
   const middleware = new Middleware(req);
   return middleware;
}

function methodResponse() {
   return createError(Error.invalidFormBody()).toResponse(HttpCode.METHOD_NOT_ALLOWED);
}

function bodyResponse() {
   return createError(Error.invalidFormBody()).toResponse(HttpCode.BAD_REQUEST);
}
