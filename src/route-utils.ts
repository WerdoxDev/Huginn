import { HttpCode } from "@shared/errors";
import Elysia from "elysia";
import { InferContext } from "..";
import cors from "@elysiajs/cors";
import bearer from "@elysiajs/bearer";

export const setup = new Elysia({ name: "setup" }).use(cors()).use(bearer());

export function hasToken(ctx: InferContext<typeof setup>): unknown {
   if (!ctx.bearer) {
      ctx.set.status = HttpCode.UNAUTHORIZED;
   }

   return undefined;
}
