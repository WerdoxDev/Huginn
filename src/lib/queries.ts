import { Snowflake } from "@shared/snowflake";
import { queryOptions } from "@tanstack/react-query";
import { HuginnClient } from "@api/index";

export function getChannelsOptions(client: HuginnClient, guildId: Snowflake) {
   return queryOptions({
      queryKey: ["channels", guildId],
      queryFn: () => {
         // FIXME: This needs to change for when guilds are actually a thing
         if (guildId !== "@me") return undefined;
         return client.channels.getAll();
      },
   });
}

export function getMessagesOptions(client: HuginnClient, channelId: Snowflake) {
   return queryOptions({
      queryKey: ["messages", channelId],
      queryFn: () => client.channels.getMessages(channelId, 50),
   });
}

export function getRelationshipsOptions(client: HuginnClient) {
   return queryOptions({
      queryKey: ["relationships"],
      queryFn: () => client.relationships.getAll(),
   });
}
