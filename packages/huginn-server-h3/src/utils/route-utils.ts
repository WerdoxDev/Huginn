import { prisma } from "@/database";
import { invalidFormBody, unauthorized } from "@huginn/backend-shared";
import { createError, getHeader, getQuery, getRouterParams, H3Event, readBody } from "h3";
import { sha256 } from "ohash";
import { z } from "zod";
import { verifyToken } from "./token-factory";

export async function useValidatedBody<T extends z.Schema>(event: H3Event, schema: T): Promise<z.infer<T>> {
   try {
      const body = await readBody(event);
      const parsedBody = await schema.parse(body);
      return parsedBody;
   } catch (e) {
      throw invalidFormBody(event);
   }
}

export async function useValidatedParams<T extends z.Schema>(event: H3Event, schema: T): Promise<z.infer<T>> {
   try {
      const params = getRouterParams(event);
      const parsedParams = await schema.parse(params);
      return parsedParams;
   } catch (e) {
      throw createError({ statusCode: 404 });
   }
}

export async function useValidatedQuery<T extends z.Schema>(event: H3Event, schema: T): Promise<z.infer<T>> {
   try {
      const query = getQuery(event);
      const parsedQuery = await schema.parse(query);
      return parsedQuery;
   } catch (e) {
      throw createError({ statusCode: 404 });
   }
}

export async function catchError<T>(fn: (() => Promise<T>) | (() => T)): Promise<[Error, null] | [null, T]> {
   try {
      return [null, await fn()];
   } catch (e) {
      return [e as Error, null];
   }
}

export async function useVerifiedJwt(event: H3Event) {
   const bearer = getHeader(event, "Authorization");

   if (!bearer) {
      throw unauthorized(event);
   }

   const token = bearer.split(" ")[1];

   const { valid, payload } = await verifyToken(token);

   if (!valid || !payload) {
      throw unauthorized(event);
   }

   if (!(await prisma.user.exists({ id: BigInt(payload.id) }))) {
      throw unauthorized(event);
   }

   return { payload, token };
}

export function getFileHash(file: Buffer) {
   const hash = sha256(file.toString()).substring(0, 32);
   return hash;
}
