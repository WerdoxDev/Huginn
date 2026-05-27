import type { HuginnClient } from "@huginn/api";

import { type APIGetUserChannelsResult, resolveImage, type Snowflake } from "@huginn/shared";
import { clientStore } from "@stores/clientStore";
import { infiniteQueryOptions, QueryClient, queryOptions } from "@tanstack/react-query";

import { updateUser } from "./query-utils";
import { convertToAppDirectChannel, convertToAppMessage, convertToAppRelationship, convertToAppUser, convertToAppUserProfile } from "./utils";

export const queryClient = new QueryClient({
   defaultOptions: {
      queries: {
         refetchOnReconnect: false,
         refetchOnWindowFocus: false,
         refetchOnMount: false,
         staleTime: 60000,
      },
   },
});

export function getInitialChannels() {
   return clientStore.getState().readyData?.privateChannels.map((x) => convertToAppDirectChannel(x));
}

export function getInitialRelationships() {
   return clientStore.getState().readyData?.relationships.map((x) => convertToAppRelationship(x));
}

export function getUserOptions(client: HuginnClient, userId: Snowflake) {
   return queryOptions({
      queryKey: ["user", userId],
      queryFn: async () => convertToAppUser(await client.users.get(userId)),
   });
}

export function getUserProfileOptions(client: HuginnClient, userId: Snowflake) {
   return queryOptions({
      queryKey: ["user-profile", userId],
      queryFn: async () => convertToAppUserProfile(await client.users.getProfile(userId)),
   });
}

export function getChannelsOptions(client: HuginnClient, guildId: Snowflake) {
   return queryOptions({
      queryKey: ["channels", guildId],
      queryFn: async () =>
         // FIXME: This needs to change for when guilds are actually a thing
         // if (guildId !== "@me") return undefined;
         (await client.channels.getAll()).map((x) => convertToAppDirectChannel(x)),

      initialData: () => getInitialChannels(),
   });
}

export function getMessagesOptions(queryClient: QueryClient, client: HuginnClient, channelId: Snowflake, enabled = true) {
   return infiniteQueryOptions({
      queryKey: ["messages", channelId],
      initialPageParam: { before: "", after: "" },
      queryFn: async ({ pageParam }) => {
         const messages = await client.channels.getMessages(
            channelId,
            50,
            pageParam.before.toString() || undefined,
            pageParam.after.toString() || undefined,
         );

         for (const message of messages) {
            updateUser(message.author, queryClient);
            for (const mention of message.mentions) {
               updateUser(mention, queryClient);
            }
         }

         return messages.map((x) => convertToAppMessage(x, "fetch"));
      },
      getPreviousPageParam(first) {
         const earliestMessage = first[0];
         return earliestMessage && first.length >= 50 ? { before: earliestMessage.id, after: "" } : undefined;
      },
      getNextPageParam(last) {
         const channels: APIGetUserChannelsResult | undefined = queryClient.getQueryData(["channels", "@me"]);
         const targetChannel = channels?.find((x) => x.id === channelId);

         const latestMessage = last.at(-1);

         return !latestMessage?.isPreview && latestMessage && !last.some((message) => message.id === targetChannel?.lastMessageId)
            ? { before: "", after: latestMessage.id }
            : undefined;

         // return !latestMessage?.isPreview && latestMessage && (!targetChannel || targetChannel.lastMessageId !== latestMessage.id)
         // ? { after: latestMessage.id, before: "" }
         // : undefined;
      },
      maxPages: 2,
      retry: false,
      enabled,
   });
}

export function getPinnedMessagesOptions(client: HuginnClient, channelId: Snowflake, limit = 50) {
   return queryOptions({
      queryKey: ["pinned-messages", channelId, limit],
      queryFn: async () => {
         const pins = await client.channels.getPinnedMessages(channelId, limit);
         return pins.map((pin) => ({
            ...pin,
            message: convertToAppMessage(pin.message, "fetch"),
         }));
      },
   });
}

export function getRelationshipsOptions(client: HuginnClient) {
   return queryOptions({
      queryKey: ["relationships"],
      queryFn: async () => (await client.relationships.getAll()).map((x) => convertToAppRelationship(x)),
      initialData: () => getInitialRelationships(),
   });
}

export function getUserAvatarOptions(userId: Snowflake | undefined, avatarHash: string | null | undefined, client?: HuginnClient) {
   return queryOptions({
      queryKey: ["avatar", userId, avatarHash],
      async queryFn() {
         if (!userId || !avatarHash || !client) {
            return null;
         }

         const data = await resolveImage(client.cdn.avatar(userId, avatarHash));
         return data ? data : null;
      },
   });
}

export function getUserBannerOptions(userId: Snowflake | undefined, bannerHash: string | null | undefined, client?: HuginnClient) {
   return queryOptions({
      queryKey: ["banner", userId, bannerHash],
      async queryFn() {
         if (!userId || !bannerHash || !client) {
            return null;
         }

         const data = await resolveImage(client.cdn.banner(userId, bannerHash));
         return data ? data : null;
      },
   });
}

export function getChannelIconOptions(channelId: Snowflake | undefined, iconHash: string | null | undefined, client?: HuginnClient) {
   return queryOptions({
      queryKey: ["channel-icon", channelId, iconHash],
      async queryFn() {
         if (!channelId || !iconHash || !client) {
            return null;
         }

         const data = await resolveImage(client.cdn.channelIcon(channelId, iconHash));
         return data ? data : null;
      },
   });
}

export function getChangelogOptions(client: HuginnClient, version: string, since?: string) {
   return queryOptions({
      queryKey: ["changelog", version, since],
      queryFn: async () => await client.common.changelog(version, since),
   });
}
