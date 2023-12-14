import Elysia from "elysia";
import { HttpCode, Error } from "@shared/errors";
import { InferContext } from "@/index";
import { isDBError, DBErrorType } from "@/src/database";
import { DatabaseMessage } from "@/src/database/database-message";
import { createError } from "@/src/factory/error-factory";
import { hasToken, setup, result, error, serverError } from "@/src/route-utils";

const route = new Elysia().get("/channels/:channelId/messages/:messageId", (ctx) => handleGetMessageById(ctx), {
   beforeHandle: hasToken,
});

async function handleGetMessageById(ctx: InferContext<typeof setup, unknown, "/:channelId/:messageId">) {
   try {
      const message = await DatabaseMessage.getMessageById(ctx.params.channelId, ctx.params.messageId);

      return result(ctx, message.toObject());
   } catch (e) {
      console.log();
      if (isDBError(e, DBErrorType.NULL_MESSAGE)) {
         return error(ctx, createError(Error.unknownMessage()), HttpCode.NOT_FOUND);
      }

      return serverError(ctx, e);
   }
}

export default route;
