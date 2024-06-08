import { Snowflake } from "@shared/snowflake";
import { client } from "./api";
import { queryOptions } from "@tanstack/react-query";

export function getChannelsOptions(guildId: Snowflake) {
   return queryOptions({
      queryKey: ["channels", guildId],
      queryFn: () => {
         // FIXME: This needs to change for when guilds are actually a thing
         if (guildId !== "@me") return undefined;
         return client.channels.getAll();
      },
      staleTime: 30000,
   });
}

export function getMessagesOptions(channelId: Snowflake) {
   return queryOptions({
      queryKey: ["messages", channelId],
      queryFn: () => client.channels.getMessages(channelId, 50),
      staleTime: 30000,
   });
}

export function getRelationshipsOptions() {
   return queryOptions({
      queryKey: ["relationships"],
      queryFn: () => client.users.getRelationships(),
      staleTime: 30000,
   });
}
