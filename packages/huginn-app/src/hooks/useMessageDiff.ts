import type { ProcessedMessage } from "@/types";
import { usePrevious } from "./usePrevious";
import { useEffect } from "react";
import { MessageType } from "@huginn/shared";

export function useMessageDiff(
   messages: ProcessedMessage[],
   options: { onMessageAdd?: (message: ProcessedMessage) => void; onMessageUpdate?: (message: ProcessedMessage) => void },
) {
   const previousMessages = usePrevious(messages);

   useEffect(() => {
      if (!previousMessages) {
         return;
      }

      const latestMessage = messages[messages.length - 1];

      // Check if a new message is visible at the bottom
      if (messages.length > (previousMessages?.length ?? 0) && latestMessage.id !== previousMessages[previousMessages.length - 1].id) {
         // Check if the message is preview (sent by us) or from realtime websocket (not fetching)
         if (latestMessage.isPreview || latestMessage.source === "websocket") {
            options.onMessageAdd?.(latestMessage);
         }
      }

      if (!previousMessages) {
         return;
      }

      // If message is updated
      for (const [index, previousMessage] of previousMessages.entries()) {
         let changed = false;
         const message = messages[index];

         // Message is probably shifted due to fetching so ignore
         if (!message || message.id !== previousMessage.id) {
            continue;
         }

         if (previousMessage.isPreview || message.isPreview) {
            continue;
         }

         if (message.isEditing && !previousMessage.isEditing) changed = true;
         if (previousMessage.content !== message.content) changed = true;
         if (previousMessage.embeds.length !== message.embeds.length) changed = true;
         if (previousMessage.attachments.length !== message.attachments.length) changed = true;

         if (previousMessage.type === MessageType.CALL && message.type === MessageType.CALL) {
            if (previousMessage.call.endedTimestamp !== message.call.endedTimestamp) changed = true;
         }

         if (changed) {
            options.onMessageUpdate?.(message);
            break;
         }
      }
   }, [messages]);
}
