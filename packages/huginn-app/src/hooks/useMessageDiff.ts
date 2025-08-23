import type { ProcessedMessage } from "@/types";
import { usePrevious } from "./usePrevious";
import { useEffect } from "react";
import { MessageType } from "@huginn/shared";
import { useChannelStore } from "@stores/channelStore";

export type ChangeType = undefined | "edit" | "embed" | "attachment" | "content" | "call" | "preview";

export function useMessageDiff(
   messages: ProcessedMessage[],
   options: {
      onMessageAdd?: (message: ProcessedMessage) => void;
      onMessageUpdate?: (previousMessage: ProcessedMessage, message: ProcessedMessage, changeType: ChangeType, isVisible: boolean) => void;
   },
) {
   const previousMessages = usePrevious(messages);
   const { currentVisibleMessages } = useChannelStore();

   useEffect(() => {
      if (!previousMessages) {
         return;
      }

      const latestMessage = messages[messages.length - 1];

      // Check if a new message is visible at the bottom
      if (messages.length > (previousMessages?.length ?? 0) && latestMessage.id !== previousMessages[previousMessages.length - 1]?.id) {
         // Check if the message is preview (sent by us) or from realtime websocket (not fetching)
         if (latestMessage.isPreview || latestMessage.source === "websocket") {
            options.onMessageAdd?.(latestMessage);
         }
      }

      if (!previousMessages) {
         return;
      }

      // If message is updated
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

            if (previousMessage.type === MessageType.CALL && message.type === MessageType.CALL) {
               if (previousMessage.call.endedTimestamp !== message.call.endedTimestamp) changedType = "call";
            }
         }

         if (changedType) {
            const isVisible = currentVisibleMessages.some((x) => x.messageId === message.id);

            options.onMessageUpdate?.(previousMessage, message, changedType, isVisible);
            break;
         }
      }
   }, [messages]);
}
