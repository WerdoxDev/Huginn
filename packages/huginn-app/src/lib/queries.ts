import { APIGetUserChannelsResult, Snowflake } from "@huginn/shared";
import { infiniteQueryOptions, QueryClient, queryOptions } from "@tanstack/react-query";
import { HuginnClient } from "@huginn/api/index";

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

export function getMessagesOptions(queryClient: QueryClient, client: HuginnClient, channelId: Snowflake) {
   return infiniteQueryOptions({
      queryKey: ["messages", channelId],
      initialPageParam: { before: "", after: "" },
      queryFn: ({ pageParam }) =>
         client.channels.getMessages(channelId, 10, pageParam.before.toString() || undefined, pageParam.after.toString() || undefined),
      getPreviousPageParam: (last, all) => {
         const earliestMessage = all[0]?.[0];
         return { before: earliestMessage.id, after: "" };
      },
      getNextPageParam: (_last, all) => {
         const channels: APIGetUserChannelsResult | undefined = queryClient.getQueryData(["channels", "@me"]);
         const thisChannel = channels?.find(x => x.id === channelId);

         const latestMessages = all[all.length - 1];
         const latestMessage = latestMessages[latestMessages.length - 1];

         return !thisChannel || thisChannel.lastMessageId !== latestMessage.id ? { after: latestMessage.id, before: "" } : undefined;
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
