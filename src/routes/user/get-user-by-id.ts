import { createError } from "../../factory/error-factory";
import { HttpCode, Error as HError } from "@shared/errors";
import { APIGetUserByIdResult } from "@shared/api-types";
import Elysia from "elysia";
import { setup, hasToken } from "../../route-utils";
import { DatabaseUser } from "../../database";
import { DBErrorType, isDBError } from "../../database/database-error";
import { logServerError } from "../../log-utils";
import { InferContext } from "../../..";

const route = new Elysia().use(setup);

route.get("/:id", (ctx) => handleGetUserById(ctx), { beforeHandle: hasToken });

export async function handleGetUserById(ctx: InferContext<typeof route, unknown, "/:id">) {
   if (!ctx.params.id) {
      ctx.set.status = HttpCode.UNAUTHORIZED;
      return undefined;
   }

   try {
      const user = await DatabaseUser.getUserById(ctx.params.id, "-email");
      const result: APIGetUserByIdResult = user.toObject();

      ctx.set.status = HttpCode.OK;
      return result;
   } catch (e) {
      if (isDBError(e) && e.error.message === DBErrorType.NULL_USER) {
         ctx.set.status = HttpCode.NOT_FOUND;
         return createError(HError.unknownUser()).toObject();
      }

      logServerError(ctx.path, e);

      ctx.set.status = HttpCode.SERVER_ERROR;
      return undefined;
   }
}

export default route;
