import type { InfiniteData, QueryClient } from "@tanstack/react-query";

import { MessageType, omit, type APIGetUserChannelsResult, type PresenceUser, type Snowflake } from "@huginn/shared";
import { produce } from "immer";

import type { AppDirectChannel, AppMessage, AppUser } from "@/types";

import { queryClient as client } from "@/lib/queries";

import { convertToAppUser } from "./utils";

export function updateUser(user: PresenceUser, queryClient = client) {
   queryClient.setQueryData<AppUser>(["user", user.id], (old) => (old ? convertToAppUser({ ...old, ...user }) : convertToAppUser(user)));
}

export function getUser(userId: Snowflake, queryClient = client) {
   return queryClient.getQueryData<AppUser>(["user", userId]);
}

export function getUsers(userIds: Snowflake[], queryClient = client) {
   return queryClient
      .getQueriesData<AppUser>({ queryKey: ["user"] })
      .map(([_, data]) => data)
      .filter((user): user is AppUser => !!user && userIds.includes(user.id));
}

export function getChannels(guildId = "@me", queryClient = client) {
   const channels = queryClient.getQueryData<AppDirectChannel[]>(["channels", guildId]);
   return channels;
}

export function getGroupChannelName(channel: AppDirectChannel, queryClient = client) {
   const recipients = getUsers(channel.recipientIds, queryClient);

   return recipients.map((x) => x.displayName).join(", ");
}

export function getChannelComputedName(channel: AppDirectChannel, recipientIds: Snowflake[], queryClient = client) {
   const groupName = getGroupChannelName(channel, queryClient);

   return channel.originalName === undefined ? channel.name : channel.originalName === null ? groupName : channel.originalName;
}

export function findChannel(channels: AppDirectChannel[] | undefined, channelId: Snowflake | undefined) {
   return channels?.find((x) => x.id === channelId);
}

export function getChannelRecipients(channelId: Snowflake, queryClient = client) {
   const channel = findChannel(getChannels("@me", queryClient), channelId);
   const recipients = getUsers(channel?.recipientIds ?? [], queryClient);

   return recipients ?? [];
}

export function updateChannelLastMessageId(channelId: Snowflake, messageId: Snowflake, queryClient = client, options?: { allowLower?: boolean }) {
   queryClient.setQueryData<APIGetUserChannelsResult>(["channels", "@me"], (data) => {
      if (!data) return undefined;

      const channelIndex = data.findIndex((x) => x.id === channelId);
      if (channelIndex === -1) return data;

      const channel = data[channelIndex];
      const isNewer = !channel.lastMessageId || BigInt(channel.lastMessageId) < BigInt(messageId);

      if (!isNewer && !options?.allowLower) {
         return data;
      }

      const updatedChannel = { ...channel, lastMessageId: messageId };

      if (isNewer) {
         return [updatedChannel, ...data.filter((x) => x.id !== channelId)];
      }

      return data.map((x) => (x.id === channelId ? updatedChannel : x));
   });
}

export function getCurrentPageMessages(channelId: Snowflake, queryClient = client) {
   const messages = queryClient.getQueryData<InfiniteData<AppMessage[], { before: string; after: string }>>(["messages", channelId]);
   return messages?.pages.flat();
}

export function getMessage(channelId: Snowflake, messageId?: Snowflake, queryClient = client) {
   const messages = queryClient.getQueryData<InfiniteData<AppMessage>>(["messages", channelId]);
   return messages?.pages.flatMap((x) => x).find((x) => x.id === messageId);
}

// export function appendAppMessage(
//    queryClient: QueryClient,
//    channelId: Snowflake,
//    previewMessage: AppMessage,
//    getTargetChannel: (id: Snowflake) => AppDirectChannel | undefined,
// ) {
//    const targetChannel = getTargetChannel(channelId);

//    queryClient.setQueryData<InfiniteData<AppMessage[], { before: string; after: string }>>(["messages", channelId], (old) => {
//       if (!old) return old;

//       const lastPageIndex = old.pages.length - 1;
//       const lastPage = old.pages[lastPageIndex];
//       const lastParams = old.pageParams[old.pageParams.length - 1];

//       const isAtLiveEnd = !lastParams.before && (!lastParams.after || lastPage.some((x) => x.id === targetChannel?.lastMessageId));

//       if (!isAtLiveEnd) return old;

//       return {
//          ...old,
//          pages: old.pages.toSpliced(lastPageIndex, 1, [...lastPage, previewMessage]),
//       };
//    });
// }

export function appendAppMessage(
   queryClient: QueryClient,
   channelId: Snowflake,
   message: AppMessage,
   targetChannel?: AppDirectChannel,
   currentChannel?: AppDirectChannel,
) {
   let inLoadedQueryPage = false;
   let inVisibleQueryPage = false;

   queryClient.setQueryData<InfiniteData<AppMessage[], { before: string; after: string }>>(
      ["messages", channelId],
      produce((draft) => {
         if (!draft) return;

         const lastPage = draft.pages[draft.pages.length - 1];
         const lastParams = draft.pageParams[draft.pageParams.length - 1];

         // See if the message can be appended to the current page
         if (!lastParams.before && (!lastParams.after || lastPage.some((x) => x.id === targetChannel?.lastMessageId))) {
            inLoadedQueryPage = true;
            if (targetChannel?.id === currentChannel?.id) {
               inVisibleQueryPage = true;
            }

            // Filter out messages with matching nonce and add the new message (In order to remove preview messages)
            const lastPageIndex = draft.pages.length - 1;
            draft.pages[lastPageIndex] = lastPage.filter((x) => !x.nonce || x.nonce !== message.nonce);
            draft.pages[lastPageIndex].push(message);
         }
      }),
   );

   return { inLoadedQueryPage, inVisibleQueryPage };
}

export function updateAppMessage(
   queryClient: QueryClient,
   channelId: Snowflake,
   messageId: Snowflake,
   updater: (old: AppMessage) => AppMessage,
   targetChannel?: AppDirectChannel,
   currentChannel?: AppDirectChannel,
) {
   let inLoadedQueryPage = false;
   let inVisibleQueryPage = false;

   queryClient.setQueryData<InfiniteData<AppMessage[]>>(
      ["messages", channelId],
      produce((draft) => {
         if (!draft) return;

         const targetPageIndex = draft.pages.findIndex((x) => x.find((y) => y.id === messageId));
         if (targetPageIndex === -1) {
            return;
         }

         inLoadedQueryPage = true;
         if (currentChannel?.id === targetChannel?.id) {
            inVisibleQueryPage = true;
         }

         const foundMessage = draft.pages.map((x) => x.find((y) => y.id === messageId)).filter((x) => !!x)[0];
         if (!foundMessage) return;

         const updatedMessage = updater(foundMessage);

         for (const page of draft.pages) {
            for (const message of page) {
               if (!message.isPreview && message.type === MessageType.REPLY && message.referencedMessage?.id === updatedMessage.id) {
                  if (!updatedMessage.isPreview && updatedMessage.type === MessageType.REPLY) {
                     message.referencedMessage = omit(updatedMessage, ["referencedMessage"]);
                  } else {
                     message.referencedMessage = updatedMessage;
                  }
               }
            }
         }

         const targetMessageIndex = draft.pages[targetPageIndex].findIndex((x) => x.id === updatedMessage.id);
         draft.pages[targetPageIndex][targetMessageIndex] = updatedMessage;
      }),
   );

   return { inLoadedQueryPage, inVisibleQueryPage };
}

export function deleteAppMessage(queryClient: QueryClient, channelId: Snowflake, messageId: Snowflake) {
   queryClient.setQueryData<InfiniteData<AppMessage[], { before: string; after: string }>>(
      ["messages", channelId],
      produce((draft) => {
         if (!draft) return;

         for (const page of draft.pages) {
            for (const message of page) {
               if (!message.isPreview && message.type === MessageType.REPLY && message.referencedMessage?.id === messageId) {
                  message.referencedMessage = null;
               }
            }
         }

         draft.pages = draft.pages.map((page) => page.filter((message) => message.id !== messageId));
      }),
   );
}
