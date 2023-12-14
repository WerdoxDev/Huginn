import Elysia, { t } from "elysia";
import { APIPostCreateDefaultMessageJSONBody } from "@shared/api-types";
import { Error, Field, HttpCode } from "@shared/errors";
import { InferContext } from "@/index";
import { DatabaseMessage } from "@/src/database/database-message";
import { createError } from "@/src/factory/error-factory";
import { verifyToken } from "@/src/factory/token-factory";
import { hasToken, setup, error, result, serverError } from "@/src/route-utils";
import { DBErrorType, isDBError } from "@/src/database";

const route = new Elysia().post("/channels/:channelId/messages", (ctx) => handleCreateMessage(ctx), {
   beforeHandle: hasToken,
   body: t.Object({
      content: t.Optional(t.String()),
      attachment: t.Optional(t.Unknown()),
      flags: t.Optional(t.Number()),
      nonce: t.Optional(t.Union([t.Number(), t.String()])),
   }),
});

async function handleCreateMessage(ctx: InferContext<typeof setup, APIPostCreateDefaultMessageJSONBody, "/:channelId">) {
   try {
      const [_isValid, payload] = await verifyToken(ctx.bearer!);

      if (!ctx.body.content && !ctx.body.attachments) {
         return error(ctx, createError(Error.invalidFormBody()));
      }

      const message = await DatabaseMessage.createDefaultMessage(
         payload!.id,
         ctx.params.channelId,
         ctx.body.content,
         ctx.body.attachments,
         ctx.body.flags,
      );

      return result(ctx, message.toObject(), HttpCode.CREATED);
   } catch (e) {
      if (isDBError(e, DBErrorType.NULL_CHANNEL)) {
         return error(ctx, createError(Error.unknownChannel()).error(e.error.cause, Field.invalidChannelId()), HttpCode.NOT_FOUND);
      }

      return serverError(ctx, e);
   }
}

export default route;
