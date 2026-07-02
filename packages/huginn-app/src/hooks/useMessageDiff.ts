import { MessageType } from "@huginn/shared";
import { useChannelStore } from "@stores/channelStore";
import { useEffect } from "react";

import type { ProcessedMessage } from "@/types";

import { usePrevious } from "./usePrevious";

export type ChangeType = undefined | "edit" | "embed" | "attachment" | "content" | "call" | "preview" | "reaction";

export function useMessageDiff(
   messages: ProcessedMessage[],
   options: {
      onMessageAdd?: (messages: ProcessedMessage[]) => void;
      onMessageUpdate?: (
         updates: { previousMessage: ProcessedMessage; message: ProcessedMessage; changeType: ChangeType; isVisible: boolean }[],
      ) => void;
   },
) {
   const previousMessages = usePrevious(messages);
   const { currentVisibleMessages } = useChannelStore();

   useEffect(() => {
      if (!previousMessages) {
         return;
      }

      // Collect all added messages
      const addedMessages: ProcessedMessage[] = [];
      if (messages.length > previousMessages.length) {
         const previousLastId = previousMessages[previousMessages.length - 1]?.id;

         for (let i = previousMessages.length; i < messages.length; i++) {
            const newMessage = messages[i];
            if (newMessage.id !== previousLastId && (newMessage.isPreview || newMessage.source === "websocket")) {
               addedMessages.push(newMessage);
            }
         }
      }

      if (addedMessages.length > 0) {
         options.onMessageAdd?.(addedMessages);
      }

      // Collect all updated messages
      const updates: { previousMessage: ProcessedMessage; message: ProcessedMessage; changeType: ChangeType; isVisible: boolean }[] = [];

      for (const [index, message] of messages.entries()) {
         let changedType: ChangeType;
         const previousMessage = previousMessages[index];

         if (previousMessage?.isPreview === true && message.isPreview === false) changedType = "preview";

         // Message is probably shifted due to fetching so ignore
         if (!previousMessage || (message.id !== previousMessage.id && previousMessage.nonce !== message.nonce)) {
            continue;
         }

         if (!previousMessage.isPreview && !message.isPreview) {
            if (message.isEditing && !previousMessage.isEditing) changedType = "edit";
            if (previousMessage.content !== message.content) changedType = "content";
            if (previousMessage.embeds.length !== message.embeds.length) changedType = "embed";
            if (previousMessage.attachments.length !== message.attachments.length) changedType = "attachment";
            if (previousMessage.reactions?.length !== message.reactions?.length) changedType = "reaction";

            if (previousMessage.type === MessageType.CALL && message.type === MessageType.CALL) {
               if (previousMessage.call.endedTimestamp !== message.call.endedTimestamp) changedType = "call";
            }
         }

         if (changedType) {
            const isVisible = currentVisibleMessages.some((x) => x.messageId === message.id);
            updates.push({ previousMessage, message, changeType: changedType, isVisible });
         }
      }

      if (updates.length > 0) {
         options.onMessageUpdate?.(updates);
      }
   }, [messages]);
}
