import Elysia, { t } from "elysia";
import { hasToken, logAndReturnError, returnError, returnResult, setup } from "../../route-utils";
import { InferContext } from "../../..";
import { APIPostCreateDMJsonBody } from "@shared/api-types";
import { Error, Field, HttpCode } from "@shared/errors";
import { verifyToken } from "../../factory/token-factory";
import { DatabaseChannel } from "../../database/database-channel";
import { createError } from "../../factory/error-factory";
import { isDBError, DBErrorType } from "../../database";

export const route = new Elysia().use(setup);

route.post("@me/channels", (ctx) => handleCreateDM(ctx), {
   beforeHandle: hasToken,
   body: t.Partial(t.Object({ recipientId: t.String(), users: t.Record(t.String(), t.String()) })),
});

export async function handleCreateDM(ctx: InferContext<typeof route, APIPostCreateDMJsonBody>) {
   try {
      const [_isValid, payload] = await verifyToken(ctx.bearer || "");

      if (ctx.body.recipientId) {
         const channel = await DatabaseChannel.createSingleDMChannel(ctx.body.recipientId);
         return returnResult(ctx, channel.toObject(), HttpCode.CREATED);
      }

      if (ctx.body.users) {
         const channel = await DatabaseChannel.createGroupDMChannel(payload!.id, ctx.body.users);
         return returnResult(ctx, channel.toObject(), HttpCode.CREATED);
      }

      return returnError(ctx, createError(Error.invalidFormBody()));
   } catch (e) {
      if (isDBError(e) && e.error.message === DBErrorType.NULL_USER) {
         return returnError(ctx, createError(Error.unknownUser()).error(e.error.cause, Field.invalidUserId()), HttpCode.NOT_FOUND);
      }
      return logAndReturnError(ctx, e);
   }
}

export default route;
