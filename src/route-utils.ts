import { TokenPayload } from "@shared/api-types";
import { Error, Error as HError, HttpCode } from "@shared/errors";
import { Context, MiddlewareHandler, ValidationTargets } from "hono";
import { createFactory } from "hono/factory";
import { z } from "zod";
import { DBError, DBErrorType, isDBError, isPrismaError, prisma } from "./database";
import { ErrorFactory, createError } from "./factory/error-factory";
import { verifyToken } from "./factory/token-factory";
import { logServerError } from "./log-utils";

export async function handleRequest(
   context: Context,
   onRequest: () => Promise<Response>,
   onError?: (error: DBError<Error & { cause: string }>) => Response | undefined
) {
   try {
      const result = await onRequest();
      return result;
   } catch (e) {
      if (onError !== undefined) {
         let errorResult;
         if (isDBError(e)) {
            if (e.isErrorType(DBErrorType.INVALID_ID)) {
               return invalidFormBody(context);
            }
            errorResult = onError(e);
         }

         if (errorResult) {
            return errorResult;
         }
      }

      let otherError = e;
      if (isPrismaError(e)) {
         otherError = new DBError(e, "PRISMA ERROR");
      }

      return serverError(context, otherError);
   }
}

export function getJwt(c: Context) {
   return c.get("jwtPayload") as TokenPayload;
}

export function getRawToken(c: Context) {
   return c.get("rawToken") as string;
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

export function fileNotFound(c: Context) {
   return error(c, createError(HError.fileNotFound()));
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
               })
            );
            break;
         case "json":
            value = await c.req.json();
            break;
         case "param":
            value = c.req.param() as Record<string, string>;
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

      if (!(await prisma.user.exists({ id: BigInt(payload.id) }))) {
         return unauthorized(c);
      }

      c.set("jwtPayload", payload);
      c.set("rawToken", token);

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
