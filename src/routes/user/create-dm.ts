import Elysia, { t } from "elysia";
import { APIPostCreateDMJsonBody } from "@shared/api-types";
import { Error, Field, HttpCode } from "@shared/errors";
import { InferContext } from "@/index";
import { isDBError, DBErrorType } from "@/src/database";
import { DatabaseChannel } from "@/src/database/database-channel";
import { createError } from "@/src/factory/error-factory";
import { verifyToken } from "@/src/factory/token-factory";
import { setup, hasToken, result, error, serverError } from "@/src/route-utils";

export const route = new Elysia().use(setup).post("/users/@me/channels", (ctx) => handleCreateDM(ctx), {
   beforeHandle: hasToken,
   body: t.Partial(t.Object({ recipientId: t.String(), users: t.Record(t.String(), t.String()) })),
});

export async function handleCreateDM(ctx: InferContext<typeof setup, APIPostCreateDMJsonBody>) {
   try {
      const [_isValid, payload] = await verifyToken(ctx.bearer!);

      if (ctx.body.recipientId) {
         const channel = await DatabaseChannel.createSingleDMChannel(payload!.id, ctx.body.recipientId);
         return result(ctx, channel.toObject(), HttpCode.CREATED);
      }

      if (ctx.body.users) {
         if (Object.entries(ctx.body.users).length === 0) {
            return error(ctx, createError(Error.invalidFormBody()));
         }

         const channel = await DatabaseChannel.createGroupDMChannel(payload!.id, ctx.body.users);
         return result(ctx, channel.toObject(), HttpCode.CREATED);
      }

      return error(ctx, createError(Error.invalidFormBody()));
   } catch (e) {
      if (isDBError(e, DBErrorType.NULL_USER)) {
         return error(ctx, createError(Error.unknownUser()).error(e.error.cause, Field.invalidUserId()), HttpCode.NOT_FOUND);
      }

      return serverError(ctx, e);
   }
}

export default route;
