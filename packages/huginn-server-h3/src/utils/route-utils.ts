import { invalidFormBody, unauthorized } from "@huginn/backend-shared";
import { sha256 } from "ohash";
import { z } from "zod";

export async function useValidatedBody<T extends z.Schema>(schema: T): Promise<z.infer<T>> {
   try {
      const body = await readBody(useEvent());
      const parsedBody = await schema.parse(body);
      return parsedBody;
   } catch (e) {
      throw invalidFormBody(useEvent());
   }
}

export async function useValidatedParams<T extends z.Schema>(schema: T): Promise<z.infer<T>> {
   try {
      const params = getRouterParams(useEvent());
      const parsedBody = await schema.parse(params);
      return parsedBody;
   } catch (e) {
      throw createError({ statusCode: 404 });
   }
}

export async function catchError<T>(fn: (() => Promise<T>) | (() => T)): Promise<[Error, null] | [null, T]> {
   try {
      return [null, await fn()];
   } catch (e) {
      return [e, null];
   }
}

export async function useVerifiedJwt() {
   const event = useEvent();
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
   const hash = sha256(file.toString());
   return hash;
}
