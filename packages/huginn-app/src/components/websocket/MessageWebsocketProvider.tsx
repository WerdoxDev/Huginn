import { useCurrentChannel } from "@hooks/api-hooks/channelHooks";
import { useCreateDMChannel } from "@hooks/mutations/useCreateDMChannel";
import type {
   APIGetUserChannelsResult,
   GatewayMessageAckData,
   GatewayMessageCreateData,
   GatewayMessageDeleteData,
   GatewayMessageUpdateData,
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

export default function MessageWebsocketProvider(props: { children?: ReactNode }) {
   const queryClient = useQueryClient();
   const currentChannel = useCurrentChannel();
   const mutation = useCreateDMChannel("create-dm-channel_other");
   const { currentVisibleMessages, updateLastMessageId, messageUploadProgresses } = useChannelStore();
   const { user } = useThisUser();
   const { addChannelToReadStates, setLatestReadMessage } = useReadStates();
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

      queryClient.setQueryData<InfiniteData<AppMessage[], { before: string; after: string }>>(["messages", d.channelId], (old) => {
         if (!old) return undefined;

         const lastPage = old.pages[old.pages.length - 1];
         const lastParams = old.pageParams[old.pageParams.length - 1];
         // See if the message can be appended to the current page
         if (!lastParams.before && (!lastParams.after || lastPage.some((x) => x.id === targetChannel?.lastMessageId))) {
            inLoadedQueryPage = true;
            if (targetChannel.id === currentChannel?.id) {
               inVisibleQueryPage = true;
            }

            return {
               ...old,
               pages: old.pages.toSpliced(old.pages.length - 1, 1, [...lastPage.filter((x) => !x.nonce || x.nonce !== d.nonce), newMessage]),
            };
         }

         return old;
      });

      updateLastMessageId(queryClient, d.channelId, d.id);

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

      queryClient.setQueryData<InfiniteData<AppMessage[], { before: string; after: string }>>(["messages", d.channelId], (old) => {
         if (!old) return undefined;

         const lastPage = old.pages[old.pages.length - 1];
         const lastParams = old.pageParams[old.pageParams.length - 1];
         // See if the message can be appended to the current page
         if (!lastParams.before && (!lastParams.after || lastPage.some((x) => x.id === targetChannel?.lastMessageId))) {
            inLoadedQueryPage = true;
            if (targetChannel.id === currentChannel?.id) {
               inVisibleQueryPage = true;
            }

            return {
               ...old,
               pages: old.pages.toSpliced(old.pages.length - 1, 1, [...lastPage.filter((x) => x.id !== d.id), updatedMessage]),
            };
         }

         return old;
      });

      updateLastMessageId(queryClient, d.channelId, d.id);

      dispatchEvent("message_updated", {
         message: updatedMessage,
         visible:
            currentChannel?.id === d.channelId &&
            currentVisibleMessages.some((x) => x.messageId === currentChannel.lastMessageId) &&
            huginnWindow.focused,
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

      // Get the new last message ID from the filtered messages
      const lastMessageId = queryClient
         .getQueryData<InfiniteData<AppMessage[], { before: string; after: string }>>(["messages", d.channelId])
         ?.pages.at(-1)
         ?.at(-1)?.id;

      if (lastMessageId) {
         updateLastMessageId(queryClient, d.channelId, lastMessageId);
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
   }, [currentChannel, user, currentVisibleMessages, huginnWindow.focused, messageUploadProgresses]);

   return props.children;
}
