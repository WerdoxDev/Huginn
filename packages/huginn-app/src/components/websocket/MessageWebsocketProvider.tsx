import { useCurrentChannel } from "@hooks/api-hooks/channelHooks";
import { useCreateDMChannel } from "@hooks/mutations/useCreateDMChannel";
import {
   MessageType,
   omit,
   type APIGetUserChannelsResult,
   type GatewayMessageAckData,
   type GatewayMessageCreateData,
   type GatewayMessageDeleteData,
   type GatewayMessageUpdateData,
} from "@huginn/shared";
import { dispatchEvent } from "@lib/event-handler";
import { convertToAppMessage } from "@lib/utils";
import { useChannelStore } from "@stores/channelStore";
import { useReadStates } from "@stores/readStatesStore";
import { useThisUser } from "@stores/userStore";
import { useHuginnWindow } from "@stores/windowStore";
import { type InfiniteData, useQueryClient } from "@tanstack/react-query";
import { type ReactNode, useEffect } from "react";
import type { AppMessage } from "@/types";
import { useClient } from "@stores/clientStore";
import { findChannel, getChannels, updateChannelLastMessageId } from "@lib/query-utils";
import { produce } from "immer";

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
      const channels = queryClient.getQueryData<APIGetUserChannelsResult>(["channels", "@me"]);
      const targetChannel = channels?.find((x) => x.id === d.channelId);
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

      let inLoadedQueryPage = false;
      let inVisibleQueryPage = false;

      queryClient.setQueryData<InfiniteData<AppMessage[], { before: string; after: string }>>(
         ["messages", d.channelId],
         produce((draft) => {
            if (!draft) return;

            const lastPage = draft.pages[draft.pages.length - 1];
            const lastParams = draft.pageParams[draft.pageParams.length - 1];

            // See if the message can be appended to the current page
            if (!lastParams.before && (!lastParams.after || lastPage.some((x) => x.id === targetChannel?.lastMessageId))) {
               inLoadedQueryPage = true;
               if (targetChannel.id === currentChannel?.id) {
                  inVisibleQueryPage = true;
               }

               // Filter out messages with matching nonce and add the new message
               const lastPageIndex = draft.pages.length - 1;
               draft.pages[lastPageIndex] = lastPage.filter((x) => !x.nonce || x.nonce !== d.nonce);
               draft.pages[lastPageIndex].push(newMessage);
            }
         }),
      );

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
   }

   async function onMessageUpdated(d: GatewayMessageUpdateData) {
      const channels = queryClient.getQueryData<APIGetUserChannelsResult>(["channels", "@me"]);
      const targetChannel = channels?.find((x) => x.id === d.channelId);
      const updatedMessage: AppMessage = convertToAppMessage(d, "websocket");

      if (!targetChannel) {
         return;
      }

      let inLoadedQueryPage = false;
      let inVisibleQueryPage = false;

      queryClient.setQueryData<InfiniteData<AppMessage[]>>(
         ["messages", d.channelId],
         produce((draft) => {
            if (!draft) return;

            const targetPageIndex = draft.pages.findIndex((x) => x.find((y) => y.id === d.id));
            if (targetPageIndex === -1) {
               return;
            }

            inLoadedQueryPage = true;
            if (currentChannel?.id === targetChannel.id) {
               inVisibleQueryPage = true;
            }

            for (const page of draft.pages) {
               for (const message of page) {
                  if (!message.isPreview && message.type === MessageType.REPLY && message.referencedMessage?.id === d.id) {
                     if (!updatedMessage.isPreview && updatedMessage.type === MessageType.REPLY) {
                        message.referencedMessage = omit(updatedMessage, ["referencedMessage"]);
                     } else {
                        message.referencedMessage = updatedMessage;
                     }
                  }
               }
            }

            const targetMessageIndex = draft.pages[targetPageIndex].findIndex((x) => x.id === d.id);
            draft.pages[targetPageIndex][targetMessageIndex] = updatedMessage;
         }),
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
      queryClient.setQueryData<InfiniteData<AppMessage[], { before: string; after: string }>>(["messages", d.channelId], (old) => {
         if (!old) return undefined;

         const newPages = old.pages.map((page) => page.filter((message) => message.id !== d.id));

         return {
            ...old,
            pages: newPages,
         };
      });

      const channel = findChannel(getChannels(undefined, queryClient), d.channelId);

      if (channel?.lastMessageId === d.id) {
         const lastMessageId = queryClient.getQueryData<InfiniteData<AppMessage[]>>(["messages", d.channelId])?.pages.at(-1)?.at(-1)?.id;

         if (lastMessageId) {
            updateChannelLastMessageId(d.channelId, lastMessageId, queryClient);

            if (readStates.some((x) => x.channelId === d.channelId && x.lastReadMessageId === d.id)) {
               setLatestReadMessage(d.channelId, lastMessageId, queryClient);
            }
         }
      }
   }

   function onMessageAck(d: GatewayMessageAckData) {
      if (currentChannel?.id !== d.channelId) {
         setLatestReadMessage(d.channelId, d.messageId, queryClient);
      }
   }

   useEffect(() => {
      client?.gateway.on("message_create", onMessageCreated);
      client?.gateway.on("message_update", onMessageUpdated);
      client?.gateway.on("message_delete", onMessageDeleted);
      client?.gateway.on("message_ack", onMessageAck);

      return () => {
         client?.gateway.off("message_create", onMessageCreated);
         client?.gateway.off("message_update", onMessageUpdated);
         client?.gateway.off("message_delete", onMessageDeleted);
         client?.gateway.off("message_ack", onMessageAck);
      };
   }, [currentChannel, user, currentVisibleMessages, huginnWindow.focused, readStates]);

   return props.children;
}
