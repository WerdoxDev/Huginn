import { InferContext } from "@/index";
import { DatabaseUser, isDBError, DBErrorType } from "@/src/database";
import { createError } from "@/src/factory/error-factory";
import { setup, hasToken, result, error, serverError } from "@/src/route-utils";
import { HttpCode, Error, Field } from "@shared/errors";
import Elysia from "elysia";

const route = new Elysia().use(setup).get("/users/:userId", (ctx) => handleGetUserById(ctx), { beforeHandle: hasToken });

export async function handleGetUserById(ctx: InferContext<typeof setup, unknown, "/:userId">) {
   try {
      const user = await DatabaseUser.getUserById(ctx.params.userId, "-email");

      return result(ctx, user.toObject());
   } catch (e) {
      if (isDBError(e, DBErrorType.NULL_USER)) {
         return error(ctx, createError(Error.unknownUser()).error(e.error.cause, Field.invalidUserId()), HttpCode.NOT_FOUND);
      }

      return serverError(ctx, e);
   }
}

export default route;
