import { TokenPayload } from "@shared/api-types";
import { Error as HError, HttpCode } from "@shared/errors";
import consola from "consola";
import { Context, Env, Input, MiddlewareHandler, ValidationTargets } from "hono";
import { createFactory } from "hono/factory";
import { validator } from "hono/validator";
import { ZodSchema, z } from "zod";
import { DBError, DBErrorType, isDBError, isPrismaError, prisma } from "./db";
import { ErrorFactory, createError } from "./factory/error-factory";
import { verifyToken } from "./factory/token-factory";
import { logServerError } from "./log-utils";

export async function handleRequest(
   c: Context,
   onRequest: (() => Promise<Response>) | (() => Response),
   onError?: (error: DBError<Error & { cause: string }>) => Response | undefined
) {
   try {
      const result = await onRequest();
      return result;
   } catch (e) {
      let errorResult;
      if (isDBError(e)) {
         errorResult = onError?.(e);

         if (errorResult) {
            return errorResult;
         }

         // Common errors
         if (e.isErrorType(DBErrorType.INVALID_ID)) {
            return invalidFormBody(c);
         }
         if (e.isErrorType(DBErrorType.NULL_USER)) {
            return notFound(c, createError(HError.unknownUser(e.error.cause)));
         }
         if (e.isErrorType(DBErrorType.NULL_RELATIONSHIP)) {
            return notFound(c, createError(HError.unknownRelationship(e.error.cause)));
         }
         if (e.isErrorType(DBErrorType.NULL_CHANNEL)) {
            return notFound(c, createError(HError.unknownChannel(e.error.cause)));
         }
         if (e.isErrorType(DBErrorType.NULL_MESSAGE)) {
            return notFound(c, createError(HError.unknownMessage(e.error.cause)));
         }

         // Custom error
      }

      let otherError = e;
      if (isPrismaError(e)) {
         otherError = new DBError(e, "PRISMA ERROR");
      }

      consola.log("LOGGING ERROR");
      return serverError(c, otherError);
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

export function serverError(c: Context, e: unknown, log = true) {
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

export function notFound(c: Context, factory: ErrorFactory) {
   return error(c, factory, HttpCode.NOT_FOUND);
}

type HasUndefined<T> = undefined extends T ? true : false;

export const hValidator = <
   T extends ZodSchema,
   Target extends keyof ValidationTargets,
   E extends Env,
   P extends string,
   In = z.input<T>,
   Out = z.output<T>,
   I extends Input = {
      in: HasUndefined<In> extends true
         ? {
              [K in Target]?: K extends "json"
                 ? In
                 : HasUndefined<keyof ValidationTargets[K]> extends true
                 ? { [K2 in keyof In]?: ValidationTargets[K][K2] }
                 : { [K2 in keyof In]: ValidationTargets[K][K2] };
           }
         : {
              [K in Target]: K extends "json"
                 ? In
                 : HasUndefined<keyof ValidationTargets[K]> extends true
                 ? { [K2 in keyof In]?: ValidationTargets[K][K2] }
                 : { [K2 in keyof In]: ValidationTargets[K][K2] };
           };
      out: { [K in Target]: Out };
   },
   V extends I = I
>(
   target: Target,
   schema: T
): MiddlewareHandler<E, P, V> =>
   // @ts-expect-error not types well
   validator(target, async (value, c) => {
      const result = await schema.safeParseAsync(value);

      if (!result.success) {
         return invalidFormBody(c);
      }

      return result.data as z.infer<T>;
   });

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
