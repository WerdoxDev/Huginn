import { InferContext } from "@/index";
import { DatabaseChannel } from "@/src/database/database-channel";
import { verifyToken } from "@/src/factory/token-factory";
import { setup, hasToken, result, serverError } from "@/src/route-utils";
import { APIGetUserChannelsResult } from "@shared/api-types";
import Elysia from "elysia";

const route = new Elysia().use(setup).get("/users/@me/channels", (ctx) => handleGetUserChannels(ctx), { beforeHandle: hasToken });

async function handleGetUserChannels(ctx: InferContext<typeof setup>) {
   try {
      const [_isValid, payload] = await verifyToken(ctx.bearer!);

      const channels = await DatabaseChannel.getUserChannels(payload!.id);
      const json: APIGetUserChannelsResult = channels.map((x) => x.toObject());

      return result(ctx, json);
   } catch (e) {
      return serverError(ctx, e);
   }
}

export default route;
