import type { InfiniteData, QueryClient } from "@tanstack/react-query";

import { MessageType, omit, type APIGetUserChannelsResult, type PresenceUser, type Snowflake } from "@huginn/shared";
import { produce } from "immer";

import type { AppDirectChannel, AppMessage, AppUser, MessageErrorType } from "@/types";

import { queryClient as client } from "@/lib/queries";

import { convertToAppUser } from "./utils";

export function updateUser(user: PresenceUser, queryClient = client) {
   queryClient.setQueryData<AppUser>(["user", user.id], (old) => (old ? convertToAppUser({ ...old, ...user }) : convertToAppUser(user)));
}

function resolveReplyReference(updatedMessage: AppMessage) {
   if (!updatedMessage.isPreview && updatedMessage.type === MessageType.REPLY) {
      return omit(updatedMessage, ["referencedMessage"]);
   }

   return updatedMessage;
}

function updateMessageInPages<T>(
   options: {
      pages: T[][];
      getMessage: (item: T) => AppMessage;
      setMessage: (page: T[], index: number, message: AppMessage) => void;
      targetMessageId: Snowflake;
      updater: (old: AppMessage) => AppMessage;
   },
   // updatedMessage: AppMessage,
) {
   let found = false;

   for (const page of options.pages) {
      for (let i = 0; i < page.length; i++) {
         const item = page[i];
         const message = options.getMessage(item);

         if (message.id === options.targetMessageId) {
            found = true;
            options.setMessage(page, i, options.updater(message));
         }

         if (!message.isPreview && message.type === MessageType.REPLY && message.referencedMessage?.id === options.targetMessageId) {
            const resolvedReference = resolveReplyReference(options.updater(message.referencedMessage));
            message.referencedMessage = resolvedReference;
         }
      }
   }

   return found;
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

type UpdateAppMessageOptions = {
   channelId: Snowflake;
   messageId: Snowflake;
   targetChannel?: AppDirectChannel;
   currentChannel?: AppDirectChannel;
} & ({ message: AppMessage; patch?: never } | { patch: Partial<AppMessage>; message?: never });

export function updateAppMessage(queryClient: QueryClient, options: UpdateAppMessageOptions) {
   let inLoadedQueryPage = false;
   let inVisibleQueryPage = options.targetChannel?.id === options.currentChannel?.id;
   // let updatedMessage: AppMessage | undefined;

   const applyUpdate = (message: AppMessage): AppMessage => {
      if (options.message) {
         return options.message;
      }

      return { ...message, ...options.patch } as AppMessage;
   };

   queryClient.setQueryData<InfiniteData<AppMessage[]>>(
      ["messages", options.channelId],
      produce((draft) => {
         if (!draft) return;

         inLoadedQueryPage = updateMessageInPages({
            pages: draft.pages,
            getMessage: (item) => item,
            setMessage: (page, index, message) => {
               page[index] = message;
            },
            targetMessageId: options.messageId,
            updater: applyUpdate,
         });
      }),
   );

   queryClient.setQueryData<InfiniteData<Array<{ message: AppMessage; pinnedAt: string | Date }>>>(
      ["pinned-messages", options.channelId],
      produce((draft) => {
         if (!draft) return;

         // let updatedPinnedMessage: AppMessage | undefined;

         const found = updateMessageInPages({
            pages: draft.pages,
            getMessage: (pin) => pin.message,
            setMessage: (page, index, next) => {
               page[index].message = next;
            },
            targetMessageId: options.messageId,
            updater: applyUpdate,
         });

         if (options.patch || options.message.isPreview) return;

         // Message is pinned and not added to pins
         if (options.message.pinned && !found) {
            const newPin = { pinnedAt: new Date().toISOString(), message: options.message };
            draft.pages[0].unshift(newPin);
         }
         // Message is unpinned and still in pins
         else if (options.message.pinned === false && found) {
            draft.pages = draft.pages.map((page) => page.filter((pin) => pin.message.id !== options.messageId));
         }
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
