import Elysia from "elysia";
import { InferContext } from "../../..";
import { setup, hasToken, logAndReturnError, returnResult } from "../../route-utils";
import { verifyToken } from "../../factory/token-factory";
import { DatabaseChannel } from "../../database/database-channel";

const route = new Elysia().use(setup).get("/@me/channels", (ctx) => handleGetUserChannels(ctx), { beforeHandle: hasToken });

async function handleGetUserChannels(ctx: InferContext<typeof setup>) {
   try {
      const [_isValid, payload] = await verifyToken(ctx.bearer!);

      const channels = await DatabaseChannel.getUserChannels(payload!.id);

      return returnResult(ctx, channels);
   } catch (e) {
      return logAndReturnError(ctx, e);
   }
}

export default route;
