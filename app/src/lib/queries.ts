import { Snowflake } from "@shared/snowflake";
import { infiniteQueryOptions, queryOptions } from "@tanstack/react-query";
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
   return infiniteQueryOptions({
      queryKey: ["messages", channelId],
      initialPageParam: { before: "", after: "" },
      queryFn: ({ pageParam }) =>
         client.channels.getMessages(
            channelId,
            10,
            pageParam.before?.toString() || undefined,
            pageParam.after?.toString() || undefined,
         ),
      getPreviousPageParam: (last, all) => {
         // console.log(_all);
         const earliestMessage = all?.[0]?.[0];
         return earliestMessage?.id !== undefined ? { before: earliestMessage.id, after: "" } : undefined;
      },
      getNextPageParam: (last, all) => {
         // const newAll = all.filter((x) => x.length > 0);
         const latestMessages = all?.[all.length - 1];
         const latestMessage = latestMessages?.[latestMessages.length - 1];
         // console.log(latestMessage?.id !== undefined ? { after: latestMessage, before: "" } : undefined);
         return latestMessage?.id !== undefined ? { after: latestMessage.id, before: "" } : undefined;

         // return filteredAll[filteredAll.length - 1][filteredAll[filteredAll.length - 1].length - 1]?.id
         //    ? { after: filteredAll[filteredAll.length - 1][filteredAll[filteredAll.length - 1].length - 1]?.id, before: "" }
         //    : undefined;
      },
      maxPages: 3,
   });
}

export function getRelationshipsOptions(client: HuginnClient) {
   return queryOptions({
      queryKey: ["relationships"],
      queryFn: () => client.relationships.getAll(),
   });
}
