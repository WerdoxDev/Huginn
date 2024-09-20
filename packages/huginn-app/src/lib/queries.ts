import { HuginnClient } from "@huginn/api";
import { APIGetUserChannelsResult, resolveBase64, resolveImage, Snowflake } from "@huginn/shared";
import { infiniteQueryOptions, QueryClient, queryOptions } from "@tanstack/react-query";

export function getChannelsOptions(client: HuginnClient, guildId: Snowflake) {
   return queryOptions({
      queryKey: ["channels", guildId],
      queryFn: () => {
         // FIXME: This needs to change for when guilds are actually a thing
         // if (guildId !== "@me") return undefined;
         return client.channels.getAll();
      },
   });
}
export function getMessagesOptions(queryClient: QueryClient, client: HuginnClient, channelId: Snowflake) {
   return infiniteQueryOptions({
      queryKey: ["messages", channelId],
      initialPageParam: { before: "", after: "" },
      queryFn: ({ pageParam }) =>
         client.channels.getMessages(channelId, 50, pageParam.before.toString() || undefined, pageParam.after.toString() || undefined),
      getPreviousPageParam(first) {
         const earliestMessage = first[0];
         return earliestMessage && first.length >= 50 ? { before: earliestMessage.id, after: "" } : undefined;
      },
      getNextPageParam(last) {
         const channels: APIGetUserChannelsResult | undefined = queryClient.getQueryData(["channels", "@me"]);
         const thisChannel = channels?.find(x => x.id === channelId);

         const latestMessage = last[last.length - 1];

         return latestMessage && (!thisChannel || thisChannel.lastMessageId !== latestMessage.id)
            ? { after: latestMessage.id, before: "" }
            : undefined;
      },
      maxPages: 2,
      retry: false,
   });
}

export function getRelationshipsOptions(client: HuginnClient) {
   return queryOptions({
      queryKey: ["relationships"],
      queryFn: () => client.relationships.getAll(),
   });
}

export function getUserAvatar(userId: Snowflake | undefined, userAvatar: string | null | undefined, client: HuginnClient) {
   return queryOptions({
      queryKey: ["avatar", userId, userAvatar],
      async queryFn() {
         return userId && userAvatar && resolveBase64(await resolveImage(client.cdn.avatar(userId, userAvatar)));
      },
   });
}
