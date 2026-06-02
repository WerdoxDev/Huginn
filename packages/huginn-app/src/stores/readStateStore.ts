import type { QueryClient } from "@tanstack/react-query";

import { ChannelType, MessageType, RelationshipType, type Snowflake } from "@huginn/shared";
import { playAudio } from "@lib/audio-player";
import { listenEvent } from "@lib/event-handler";
import { findChannel, getChannels, getCurrentPageMessages, getUser, getUsers } from "@lib/query-utils";
import { windowStore } from "@stores/windowStore";
import { produce } from "immer";
import { useMemo } from "react";
import { createStore, useStore } from "zustand";
import { combine } from "zustand/middleware";

import { sendNotification } from "../contexts/NotificationContext";
import { clientStore } from "./clientStore";
import { themeStore } from "./themeStore";

export type ContextReadState = {
   channelId: Snowflake;
   lastReadMessageId?: Snowflake;
   unreadCount: number;
};

const initialStore = () => ({
   readStates: [] as Array<ContextReadState>,
   friendsNotificationsCount: 0,
});

type StoreType = ReturnType<typeof initialStore>;

const store = createStore(
   combine(initialStore(), (set) => ({
      setFriendsNotificationsCount: (count: number) => set({ friendsNotificationsCount: count }),
      setLatestReadMessage: (channelId: Snowflake, messageId: Snowflake, queryClient: QueryClient, userId?: Snowflake) => {
         const messages = getCurrentPageMessages(channelId, queryClient);

         // Always update lastReadMessageId. Compute unreadCount from cache when available,
         // filtering out the current user's own messages (mirroring server-side countUnreadMessages).
         // Fall back to 0 when messages aren't loaded — the server is authoritative on the next ready event.
         const unreadCount = messages ? messages.filter((x) => BigInt(x.id) > BigInt(messageId) && (!userId || x.authorId !== userId)).length : 0;

         set(
            produce((draft: StoreType) => {
               draft.readStates = draft.readStates.filter((x) => x.channelId !== channelId);
               draft.readStates.push({
                  channelId,
                  lastReadMessageId: messageId,
                  unreadCount,
               });
            }),
         );
      },
      setReadState: (readState: ContextReadState) =>
         set(
            produce((draft: StoreType) => {
               const idx = draft.readStates.findIndex((x) => x.channelId === readState.channelId);
               if (idx !== -1) {
                  draft.readStates[idx] = readState;
               }
            }),
         ),
      addChannelToReadStates: (channelId: Snowflake) =>
         set(
            produce((draft: StoreType) => {
               draft.readStates.push({ channelId, lastReadMessageId: undefined, unreadCount: 0 });
            }),
         ),
      removeChannelFromReadStates: (channelId: Snowflake) =>
         set(
            produce((draft: StoreType) => {
               draft.readStates = draft.readStates.filter((x) => x.channelId !== channelId);
            }),
         ),

      increaseUnreadCount: (channelId: Snowflake) =>
         set(
            produce((draft: StoreType) => {
               const readStateIndex = draft.readStates.findIndex((x) => x.channelId === channelId);
               if (readStateIndex !== -1) {
                  draft.readStates[readStateIndex].unreadCount++;
               }
            }),
         ),
   })),
);

export function initReadStateStore() {
   const client = clientStore.getState().client;
   if (!client) return;

   const unlisten = client.gateway.listen("ready", (d) => {
      store.setState({
         readStates: d.readStates.map((x) => ({
            channelId: x.channelId,
            lastReadMessageId: x.lastReadMessageId ?? undefined,
            unreadCount: x.unreadCount,
         })),
      });
      store.getState().setFriendsNotificationsCount(d.relationships.filter((x) => x.type === RelationshipType.PENDING_INCOMING).length);
   });

   const unlisten2 = listenEvent("message_added", async (data) => {
      if (!data.self && !data.visible && !data.message.isPreview) {
         const author = getUser(data.message.authorId);
         const mentions = getUsers(data.message.mentions);
         const channel = findChannel(getChannels(), data.message.channelId);

         if (windowStore.getState().environment === "desktop") {
            let content;
            const username = author?.displayName ?? "Unknown User";
            const title = username + (channel?.type === ChannelType.GROUP_DM ? `- (${channel.name})` : "");

            switch (data.message.type) {
               case MessageType.DEFAULT:
                  if (data.message.content) {
                     content = data.message.content;
                  } else if (data.message.attachments.length !== 0) {
                     content = `Uploaded ${data.message.attachments[0].filename}`;
                  }
                  break;
               case MessageType.RECIPIENT_ADD:
                  content = `${username} added ${mentions[0].displayName}`;
                  break;
               case MessageType.RECIPIENT_REMOVE:
                  content = `${username} removed ${mentions[0].displayName}`;
                  break;
               case MessageType.CALL:
                  content = `${username} started a call`;
                  break;
               case MessageType.CHANNEL_NAME_CHANGED:
                  content = `${username} changed the channel name to ${data.message.content}`;
                  break;
               case MessageType.CHANNEL_ICON_CHANGED:
                  content = `${username} changed the channel icon`;
                  break;
               case MessageType.CHANNEL_OWNER_CHANGED:
                  content = `${username} promoted ${mentions[0].displayName} to Channel Owner`;
                  break;
            }

            const theme = themeStore.getState().themeType;

            sendNotification(data.message.channelId, title, content ?? "", author?.avatar ?? theme ?? undefined);
         }

         playAudio("notification", true);

         store.getState().increaseUnreadCount(data.message.channelId);
      }
   });

   return () => {
      unlisten();
      unlisten2();
   };
}

export function useChannelReadState(channelId: Snowflake) {
   const thisStore = useStore(store);
   return useMemo(() => thisStore.readStates.find((x) => x.channelId === channelId), [thisStore.readStates, channelId]);
}

export function useReadStates() {
   return useStore(store);
}
