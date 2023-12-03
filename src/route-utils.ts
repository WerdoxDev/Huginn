import cors from "@elysiajs/cors";
import bearer from "@elysiajs/bearer";
import { HttpCode } from "@shared/errors";
import Elysia from "elysia";
import { createError } from "./factory/error-factory";

export const setup = new Elysia({ name: "setup" }).use(cors()).use(bearer());

export function hasToken({ bearer }: { bearer: string | undefined }) {
   if (!bearer) return createError().toResponse(HttpCode.UNAUTHORIZED);

   return undefined;
}
