import Elysia from "elysia";
import { HttpCode, Error } from "@shared/errors";
import { InferContext } from "@/index";
import { isDBError, DBErrorType } from "@/src/database";
import { DatabaseChannel } from "@/src/database/database-channel";
import { createError } from "@/src/factory/error-factory";
import { hasToken, setup, result, error, serverError } from "@/src/route-utils";

const route = new Elysia().get("/channels/:channelId", (ctx) => handleGetChannelById(ctx), { beforeHandle: hasToken });

async function handleGetChannelById(ctx: InferContext<typeof setup, unknown, "/:channelId">) {
   try {
      const channel = await DatabaseChannel.getChannelById(ctx.params.channelId);

      return result(ctx, channel.toObject());
   } catch (e) {
      if (isDBError(e, DBErrorType.NULL_CHANNEL)) {
         return error(ctx, createError(Error.unknownChannel()), HttpCode.NOT_FOUND);
      }

      return serverError(ctx, e);
   }
}

export default route;
