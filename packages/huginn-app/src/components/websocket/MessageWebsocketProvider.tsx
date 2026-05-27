import { useCurrentChannel } from "@hooks/api-hooks/channelHooks";
import { useCreateDMChannel } from "@hooks/mutations/useCreateDMChannel";
import {
   type GatewayMessageAckData,
   type GatewayMessageCreateData,
   type GatewayMessageDeleteData,
   type GatewayMessageUpdateData,
} from "@huginn/shared";
import { dispatchEvent } from "@lib/event-handler";
import { appendAppMessage, deleteAppMessage, findChannel, getChannels, updateAppMessage, updateChannelLastMessageId } from "@lib/query-utils";
import { convertToAppMessage } from "@lib/utils";
import { useChannelStore } from "@stores/channelStore";
import { useClient } from "@stores/clientStore";
import { useReadStates } from "@stores/readStatesStore";
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

   async function onMessageCreated(d: GatewayMessageCreateData) {
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

   async function onMessageUpdated(d: GatewayMessageUpdateData) {
      const targetChannel = findChannel(getChannels(undefined, queryClient), d.channelId);
      const updatedMessage: AppMessage = convertToAppMessage(d, "websocket");

      if (!targetChannel) {
         return;
      }

      const { inLoadedQueryPage, inVisibleQueryPage } = updateAppMessage(
         queryClient,
         d.channelId,
         d.id,
         () => updatedMessage,
         targetChannel,
         currentChannel,
      );

      dispatchEvent("message_updated", {
         message: updatedMessage,
         visible: currentChannel?.id === d.channelId && currentVisibleMessages.some((x) => x.messageId === d.id) && huginnWindow.focused,
         inLoadedQueryPage: inLoadedQueryPage,
         inVisibleQueryPage: inVisibleQueryPage,
         self: d.author.id === user?.id,
      });
   }

   async function onMessageDeleted(d: GatewayMessageDeleteData) {
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

   function onMessageAck(d: GatewayMessageAckData) {
      if (currentChannel?.id !== d.channelId) {
         setLatestReadMessage(d.channelId, d.messageId, queryClient, user?.id);
      }
   }

   useEffect(() => {
      const unlisteners: Array<(() => void) | undefined> = [];

      unlisteners.push(client?.gateway.listen("message_create", onMessageCreated));
      unlisteners.push(client?.gateway.listen("message_update", onMessageUpdated));
      unlisteners.push(client?.gateway.listen("message_delete", onMessageDeleted));
      unlisteners.push(client?.gateway.listen("message_ack", onMessageAck));

      return () => {
         for (const unlisten of unlisteners) {
            unlisten?.();
         }
      };
   }, [currentChannel, user, currentVisibleMessages, huginnWindow.focused, readStates]);

   return props.children;
}
