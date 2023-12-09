import { createError } from "../../factory/error-factory";
import Elysia from "elysia";
import { setup, hasToken, logAndReturnError, returnUnauthorized, returnResult } from "../../route-utils";
import { DBErrorType, isDBError } from "../../database/database-error";
import { InferContext } from "../../..";
import { HttpCode, Error } from "@shared/errors";
import { APIGetChannelByIdResult } from "@shared/api-types";
import { DatabaseChannel } from "../../database/database-channel";

const route = new Elysia().use(setup);

route.get("/:id", (ctx) => handleGetChannelById(ctx), { beforeHandle: hasToken });

export async function handleGetChannelById(ctx: InferContext<typeof route, unknown, "/:id">) {
   if (!ctx.params.id) {
      return returnUnauthorized(ctx);
   }

   try {
      const channel = await DatabaseChannel.getChannelById(ctx.params.id);
      const result: APIGetChannelByIdResult = channel.toObject();

      return returnResult(ctx, result);
   } catch (e) {
      if (isDBError(e) && e.error.message === DBErrorType.NULL_CHANNEL) {
         ctx.set.status = HttpCode.NOT_FOUND;
         return createError(Error.unknownChannel()).toObject();
      }

      return logAndReturnError(ctx, e);
   }
}

export default route;
