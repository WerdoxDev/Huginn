import { InferContext } from "@/index";
import { DatabaseMessage } from "@/src/database/database-message";
import { hasToken, result, serverError, setup } from "@/src/route-utils";
import { APIGetChannelMessagesResult } from "@shared/api-types";
import Elysia, { t } from "elysia";

const route = new Elysia().get("/channels/:channelId/messages", (ctx) => handleGetChannelMessages(ctx), {
   beforeHandle: hasToken,
   query: t.Object({ limit: t.Optional(t.String()) }),
});

async function handleGetChannelMessages(ctx: InferContext<typeof setup, unknown, "/:channelId", { limit?: string }>) {
   try {
      const limit = Number(ctx.query.limit) || 50;

      const messages = await DatabaseMessage.getMessages(ctx.params.channelId, limit);
      const json: APIGetChannelMessagesResult = messages.map((x) => x.toObject());
      return result(ctx, json);
   } catch (e) {
      return serverError(ctx, e);
   }
}

export default route;
