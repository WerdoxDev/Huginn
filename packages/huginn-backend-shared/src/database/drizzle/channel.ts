import { analytics, idFix, recordSpanError, type Snowflake } from "@huginnjs/shared";

import { assertExists, assertId, assertObj } from "#database/error";
import { DBErrorType } from "#types";

import type { ChannelArgs, ChannelPayload } from "./common";

import { drizzle } from "./db";

export const channelRepo = {
   async getById<Args extends ChannelArgs>(id: Snowflake, args?: Args) {
      return analytics.startActiveSpan("db.channel.getById", async (span) => {
         span.setAttribute("query.channel.id", id);
         const methodName = "channel.getById";
         assertId(methodName, id);
         try {
            const channel = await drizzle.channel.findUnique({ where: { id: BigInt(id) }, ...args }).throw();
            assertObj(methodName, channel, DBErrorType.NULL_CHANNEL, id);
            return idFix(channel as ChannelPayload<Args>);
         } catch (e) {
            recordSpanError(e);
            await assertExists(e, methodName, DBErrorType.NULL_CHANNEL, [id]);
            throw e;
         }
      });
   },
};
