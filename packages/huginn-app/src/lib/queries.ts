import type { HuginnClient } from "@huginnjs/api";

import { type APIGetUserChannelsResult, type ImageSize, resolveImage, type Snowflake } from "@huginnjs/shared";
import { clientStore } from "@stores/clientStore";
import { broadcastQueryClient } from "@tanstack/query-broadcast-client-experimental";
import { experimental_createQueryPersister } from "@tanstack/query-persist-client-core";
import { infiniteQueryOptions, QueryClient, queryOptions } from "@tanstack/react-query";

import { BroadcastStorage } from "./broadcast-storage";
import { Gallery } from "./capacitor/gallery-plugin";
import { updateUser } from "./query-utils";
import { convertToAppDirectChannel, convertToAppMessage, convertToAppRelationship, convertToAppUser, convertToAppUserProfile } from "./utils";
import { getVoiceHostId } from "./voice/voice-window";

const hostId = getVoiceHostId();
const storage = new BroadcastStorage(`huginn-query-storage:${hostId}`);

if (window.opener) {
   await storage.ready;
}

export const persister = experimental_createQueryPersister({
   storage: storage,
});

export const queryClient = new QueryClient({
   defaultOptions: {
      queries: {
         refetchOnReconnect: false,
         refetchOnWindowFocus: false,
         refetchOnMount: false,
         staleTime: 60000,
         persister: persister.persisterFn,
      },
   },
});

const stopBroadcast = broadcastQueryClient({
   queryClient,
   broadcastChannel: `tanstack-query:${hostId}`,
});

if (import.meta.hot) {
   import.meta.hot.dispose(() => {
      stopBroadcast?.();
   });
}

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
            20,
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
         return earliestMessage && first.length >= 20 ? { before: earliestMessage.id, after: "" } : undefined;
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
      maxPages: 4,
      retry: false,
      enabled,
   });
}

export function getPinnedMessagesOptions(client: HuginnClient, channelId: Snowflake, limit = 10) {
   return infiniteQueryOptions({
      queryKey: ["pinned-messages", channelId],
      queryFn: async ({ pageParam }) => {
         const pins = await client.channels.getPinnedMessages(channelId, limit, pageParam || undefined);
         return pins.map((pin) => ({
            ...pin,
            message: convertToAppMessage(pin.message, "fetch"),
         }));
      },
      initialPageParam: "",
      getNextPageParam: (lastPage) => {
         if (lastPage.length < limit) return undefined;
         return lastPage[lastPage.length - 1].message.id;
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

export function getUserAvatarOptions(
   userId: Snowflake | undefined,
   avatarHash: string | null | undefined,
   cdnSize?: ImageSize,
   client?: HuginnClient,
) {
   return queryOptions({
      queryKey: ["avatar", userId, avatarHash],
      async queryFn() {
         if (!userId || !avatarHash || !client) {
            return null;
         }

         const data = await resolveImage(client.cdn.avatar(userId, avatarHash, { size: cdnSize }));
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

export function getChannelIconOptions(
   channelId: Snowflake | undefined,
   iconHash: string | null | undefined,
   cdnSize?: ImageSize,
   client?: HuginnClient,
) {
   return queryOptions({
      queryKey: ["channel-icon", channelId, iconHash],
      async queryFn() {
         if (!channelId || !iconHash || !client) {
            return null;
         }

         const data = await resolveImage(client.cdn.channelIcon(channelId, iconHash, { size: cdnSize }));
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

export function getMobileFilesOptions(limit: number) {
   return infiniteQueryOptions({
      queryKey: ["mobile-files"],
      queryFn: async ({ pageParam }) => {
         console.log("Fetching media with cursor", pageParam);
         const result = await Gallery.getMedia({ types: "all", after: pageParam, limit });
         if ("error" in result) {
            throw new Error(result.error);
         }

         return result;
      },

      initialPageParam: "0",
      getNextPageParam: (lastPage) => {
         if (lastPage.media.length < limit) return undefined;
         return lastPage.cursor.toString();
      },
   });
}

export function getGifCategoriesOptions(client: HuginnClient) {
   return queryOptions({
      queryKey: ["gif-categories"],
      queryFn: async () => await client.gifs.getCategories(),
   });
}

export function getTrendingGifsOptions(client: HuginnClient, limit = 25) {
   return infiniteQueryOptions({
      queryKey: ["trending-gifs"],
      queryFn: async ({ pageParam }) => await client.gifs.getTrending(limit, pageParam),
      initialPageParam: 1,
      getNextPageParam: (lastPage, _allPages, lastParams) => {
         if (lastPage.length < limit) return undefined;
         return lastParams + 1;
      },
   });
}

export function getSearchGifsOptions(client: HuginnClient, query: string, limit = 25) {
   return infiniteQueryOptions({
      queryKey: ["search-gifs", query],
      queryFn: async ({ pageParam }) => await client.gifs.search(query, limit, pageParam),
      initialPageParam: 1,
      getNextPageParam: (lastPage, _allPages, lastParams) => {
         if (lastPage.length < limit) return undefined;
         return lastParams + 1;
      },
   });
}
