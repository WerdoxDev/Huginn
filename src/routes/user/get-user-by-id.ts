import { createError } from "../../factory/error-factory";
import { HttpCode, Error, Field } from "@shared/errors";
import Elysia from "elysia";
import { setup, hasToken, logAndReturnError, returnResult, returnError } from "../../route-utils";
import { DatabaseUser } from "../../database";
import { DBErrorType, isDBError } from "../../database/database-error";
import { InferContext } from "../../..";

const route = new Elysia().use(setup);

route.get("/:id", (ctx) => handleGetUserById(ctx), { beforeHandle: hasToken });

export async function handleGetUserById(ctx: InferContext<typeof route, unknown, "/:id">) {
   try {
      const user = await DatabaseUser.getUserById(ctx.params.id, "-email");

      return returnResult(ctx, user.toObject());
   } catch (e) {
      if (isDBError(e) && e.error.message === DBErrorType.NULL_USER) {
         return returnError(ctx, createError(Error.unknownUser()).error(e.error.cause, Field.invalidUserId()), HttpCode.NOT_FOUND);
      }

      return logAndReturnError(ctx, e);
   }
}

export default route;
