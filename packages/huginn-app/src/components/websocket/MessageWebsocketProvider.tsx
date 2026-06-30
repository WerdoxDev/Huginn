import { useCurrentChannel } from "@hooks/api-hooks/channelHooks";
import { useCreateDMChannel } from "@hooks/mutations/useCreateDMChannel";
import {
   type APIReaction,
   type GatewayMessageAckData,
   type GatewayMessageCreateData,
   type GatewayMessageDeleteData,
   type GatewayMessageReactionAddData,
   type GatewayMessageUpdateData,
} from "@huginn/shared";
import { dispatchEvent } from "@lib/event-handler";
import {
   appendAppMessage,
   deleteAppMessage,
   findChannel,
   getChannels,
   getMessage,
   updateAppMessage,
   updateChannelLastMessageId,
} from "@lib/query-utils";
import { convertToAppMessage } from "@lib/utils";
import { useChannelStore } from "@stores/channelStore";
import { useClient } from "@stores/clientStore";
import { useReadStates } from "@stores/readStateStore";
import { useThisUser } from "@stores/userStore";
import { useHuginnWindow } from "@stores/windowStore";
import { type InfiniteData, notifyManager, useQueryClient } from "@tanstack/react-query";
import { type ReactNode, useEffect } from "react";

import type { AppMessage } from "@/types";

export default function MessageWebsocketProvider(props: { children?: ReactNode }) {
   const queryClient = useQueryClient();
   const currentChannel = useCurrentChannel();
   const mutation = useCreateDMChannel("create-dm-channel_other");
   const { currentVisibleMessages } = useChannelStore();
   const { user } = useThisUser();
   const { addChannelToReadStates, setLatestReadMessage, readStates } = useReadStates();
   const huginnWindow = useHuginnWindow();
   const client = useClient();

   async function handleMessageCreated(d: GatewayMessageCreateData) {
      const targetChannel = findChannel(getChannels(undefined, queryClient), d.channelId);
      const newMessage: AppMessage = convertToAppMessage(d, "websocket");

      if (!targetChannel) {
         await mutation.mutateAsync({ recipients: [d.author.id], skipNavigation: true });
         addChannelToReadStates(d.channelId);
         dispatchEvent("message_added", {
            message: newMessage,
            visible: false,
            inLoadedQueryPage: false,
            inVisibleQueryPage: false,
            self: d.author.id === user?.id,
         });
         return;
      }

      notifyManager.batch(() => {
         const { inLoadedQueryPage, inVisibleQueryPage } = appendAppMessage(queryClient, d.channelId, newMessage, targetChannel, currentChannel);
         updateChannelLastMessageId(d.channelId, d.id, queryClient);

         dispatchEvent("message_added", {
            message: newMessage,
            visible:
               currentChannel?.id === d.channelId &&
               currentVisibleMessages.some((x) => x.messageId === currentChannel.lastMessageId) &&
               huginnWindow.focused,
            inLoadedQueryPage: inLoadedQueryPage,
            inVisibleQueryPage: inVisibleQueryPage,
            self: d.author.id === user?.id,
         });
      });
   }

   async function handleMessageUpdated(d: GatewayMessageUpdateData) {
      const targetChannel = findChannel(getChannels(undefined, queryClient), d.channelId);
      const updatedMessage: AppMessage = convertToAppMessage(d, "websocket");

      if (!targetChannel) return;

      const { inLoadedQueryPage, inVisibleQueryPage } = updateAppMessage(queryClient, {
         channelId: d.channelId,
         messageId: d.id,
         message: updatedMessage,
         targetChannel,
         currentChannel,
      });

      dispatchEvent("message_updated", {
         message: updatedMessage,
         visible: currentChannel?.id === d.channelId && currentVisibleMessages.some((x) => x.messageId === d.id) && huginnWindow.focused,
         inLoadedQueryPage: inLoadedQueryPage,
         inVisibleQueryPage: inVisibleQueryPage,
         self: d.author.id === user?.id,
      });
   }

   async function handleMessageDeleted(d: GatewayMessageDeleteData) {
      deleteAppMessage(queryClient, d.channelId, d.id);

      const channel = findChannel(getChannels(undefined, queryClient), d.channelId);

      if (channel?.lastMessageId === d.id) {
         const lastMessageId = queryClient.getQueryData<InfiniteData<AppMessage[]>>(["messages", d.channelId])?.pages.at(-1)?.at(-1)?.id;

         if (lastMessageId) {
            updateChannelLastMessageId(d.channelId, lastMessageId, queryClient, { allowLower: true });

            if (readStates.some((x) => x.channelId === d.channelId && x.lastReadMessageId === d.id)) {
               setLatestReadMessage(d.channelId, lastMessageId, queryClient, user?.id);
            }
         }
      }
   }

   function handleMessageAck(d: GatewayMessageAckData) {
      if (currentChannel?.id !== d.channelId) {
         setLatestReadMessage(d.channelId, d.messageId, queryClient, user?.id);
      }
   }

   function handleMessageReactionAdd(d: GatewayMessageReactionAddData) {
      const message = getMessage(d.channelId, d.messageId, queryClient);
      if (message?.isPreview === true) return;

      const isMe = d.userId === user?.id;
      const existingIndex = message?.reactions?.findIndex((r) => r.emoji.id === d.emoji.id && r.emoji.name === d.emoji.name);
      let updatedReactions: APIReaction[];

      if (!message?.reactions || existingIndex === -1) {
         const newReaction: APIReaction = {
            count: 1,
            emoji: d.emoji,
            me: isMe,
         };
         updatedReactions = [...(message?.reactions ?? []), newReaction];
      } else {
         updatedReactions = message.reactions.map((r, i) => (i === existingIndex ? { ...r, count: r.count + 1, me: r.me || isMe } : r));
      }

      updateAppMessage(queryClient, {
         channelId: d.channelId,
         messageId: d.messageId,
         patch: { reactions: updatedReactions },
         targetChannel: findChannel(getChannels(undefined, queryClient), d.channelId),
         currentChannel,
      });
   }

   function handleMessageReactionRemove(d: GatewayMessageReactionAddData) {
      const message = getMessage(d.channelId, d.messageId, queryClient);
      if (message?.isPreview) return;
      if (!message?.reactions?.length) return;

      const isMe = d.userId === user?.id;

      const updatedReactions = message.reactions
         .map((r) => (r.emoji.id === d.emoji.id && r.emoji.name === d.emoji.name ? { ...r, count: r.count - 1, me: isMe ? false : r.me } : r))
         .filter((r) => r.count > 0);

      updateAppMessage(queryClient, {
         channelId: d.channelId,
         messageId: d.messageId,
         patch: { reactions: updatedReactions },
         targetChannel: findChannel(getChannels(undefined, queryClient), d.channelId),
         currentChannel,
      });
   }

   useEffect(() => {
      const unlisteners: Array<(() => void) | undefined> = [];

      unlisteners.push(client?.gateway.listen("message_create", handleMessageCreated));
      unlisteners.push(client?.gateway.listen("message_update", handleMessageUpdated));
      unlisteners.push(client?.gateway.listen("message_delete", handleMessageDeleted));
      unlisteners.push(client?.gateway.listen("message_ack", handleMessageAck));
      unlisteners.push(client?.gateway.listen("message_reaction_add", handleMessageReactionAdd));
      unlisteners.push(client?.gateway.listen("message_reaction_remove", handleMessageReactionRemove));

      return () => {
         for (const unlisten of unlisteners) {
            unlisten?.();
         }
      };
   }, [currentChannel, user, currentVisibleMessages, huginnWindow.focused, readStates]);

   return props.children;
}
