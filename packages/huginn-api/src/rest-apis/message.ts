import { Routes, type Snowflake } from "@huginnjs/shared";

import type { REST } from "../rest";

export class MessageAPI {
   private readonly rest: REST;

   public constructor(rest: REST) {
      this.rest = rest;
   }

   public async createReaction(channelId: Snowflake, messageId: Snowflake, emojiId: string | null, emojiName: string): Promise<void> {
      const emojiKey = emojiId ? `${emojiName}:${emojiId}` : emojiName;
      return this.rest.put(Routes.channelMessageReaction(channelId, messageId, encodeURIComponent(emojiKey)), {
         auth: true,
      }) as Promise<void>;
   }

   public async removeReaction(channelId: Snowflake, messageId: Snowflake, emojiId: string | null, emojiName: string): Promise<void> {
      const emojiKey = emojiId ? `${emojiName}:${emojiId}` : emojiName;
      return this.rest.delete(Routes.channelMessageReaction(channelId, messageId, encodeURIComponent(emojiKey)), {
         auth: true,
      }) as Promise<void>;
   }
}
