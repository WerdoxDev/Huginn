import { Snowflake } from "@shared/snowflake";
import { client } from "./api";
import { queryOptions } from "@tanstack/react-query";

export function getChannelsOption(guildId: Snowflake) {
   return queryOptions({
      queryKey: ["channels", guildId],
      queryFn: () => {
         // FIXME: This needs to change for when guilds are actually a thing
         if (guildId !== "@me") return undefined;
         return client.channels.getAll();
      },
   });
}

export function getMessagesOptions(channelId: Snowflake) {
   return queryOptions({
      queryKey: ["messages", channelId],
      queryFn: () => client.channels.getMessages(channelId, 50),
      // staleTime: 0,
      gcTime: 0,
   });
}
