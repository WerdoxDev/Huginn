import { Error as HError, HttpCode } from "@shared/errors";
import { TokenPayload } from "@shared/api-types";
import { Context, MiddlewareHandler, ValidationTargets } from "hono";
import { createFactory } from "hono/factory";
import { z } from "zod";
import { DBError, isDBError, isPrismaError, prisma } from "./database";
import { ErrorFactory, createError } from "./factory/error-factory";
import { verifyToken } from "./factory/token-factory";
import { logServerError } from "./log-utils";

export async function handleRequest(
   context: Context,
   onRequest: () => Promise<Response>,
   onError?: (error: DBError<Error & { cause: string }>) => Response | undefined,
) {
   try {
      const result = await onRequest();
      return result;
   } catch (e) {
      if (onError !== undefined) {
         let errorResult;
         if (isDBError(e)) {
            errorResult = onError(e);
         }

         if (errorResult) {
            return errorResult;
         }
      }

      let error = e;
      if (isPrismaError(e)) {
         error = new DBError(e, "PRISMA ERROR");
      }

      return serverError(context, error);
   }
}

export function getJwt(c: Context) {
   return c.get("jwtPayload") as TokenPayload;
}

export function error(c: Context, e: ErrorFactory, code: HttpCode = HttpCode.BAD_REQUEST) {
   return c.json(e.toObject(), code);
}

export function serverError(c: Context, e: unknown, log: boolean = true) {
   if (log) {
      logServerError(c.req.path, e);
   }

   return error(c, createError(HError.serverError()), HttpCode.SERVER_ERROR);
}

export function unauthorized(c: Context) {
   return error(c, createError(HError.unauthorized()), HttpCode.UNAUTHORIZED);
}

export function invalidFormBody(c: Context) {
   return error(c, createError(HError.invalidFormBody()));
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function hValidator(target: keyof ValidationTargets, schema: z.ZodType<any, z.ZodTypeDef, any>): MiddlewareHandler {
   return createFactory().createMiddleware(async (c, next) => {
      let value: unknown;
      switch (target) {
         case "query":
            value = Object.fromEntries(
               Object.entries(c.req.queries()).map(([k, v]) => {
                  return v.length === 1 ? [k, v[0]] : [k, v];
               }),
            );
            break;
         case "json":
            value = await c.req.json();
            break;

         default:
            await next();
            return;
      }

      const parsed = schema.safeParse(value);
      if (!parsed.success) {
         return invalidFormBody(c);
      }

      await next();
   });
}

export function verifyJwt(): MiddlewareHandler {
   return createFactory().createMiddleware(async (c, next) => {
      const bearer = c.req.header("Authorization");
      if (!bearer) {
         return unauthorized(c);
      }

      const token = bearer.split(" ")[1];

      const { valid, payload } = await verifyToken(token);

      if (!valid || !payload) {
         return unauthorized(c);
      }

      if (!(await prisma.user.exists({ id: payload.id }))) {
         return unauthorized(c);
      }

      c.set("jwtPayload", payload);

      await next();
   });
}

export async function tryGetBodyJson(reqOrRes: Context["req"] | Context["res"]): Promise<unknown> {
   try {
      return await reqOrRes.json();
   } catch (e) {
      return undefined;
   }
}
