import type { Snowflake } from "@huginn/shared";

import { useChannelStore } from "@stores/channelStore";
import moment from "moment";
import { useCallback, useEffect } from "react";

import type { AppMessage } from "@/types";

export function useVisibleMessages(channelId: Snowflake, sortedMessages: AppMessage[]) {
   const { addVisibleMessage, removeVisibleMessage, clearVisibleMessages } = useChannelStore();

   const onMessageVisibilityChanged = useCallback(
      (messageId: Snowflake, isVisible: boolean) => {
         const foundMessage = sortedMessages.find((x) => x.id === messageId);
         if (!foundMessage) {
            return;
         }
         if (isVisible) {
            addVisibleMessage(foundMessage.id, moment(foundMessage.timestamp).valueOf(), channelId);
         } else {
            removeVisibleMessage(foundMessage.id);
         }
      },
      [sortedMessages, channelId],
   );
   // function onMessageVisibilityChanged(messageId: Snowflake, isVisible: boolean) {
   //    const foundMessage = sortedMessages.find((x) => x.id === messageId);
   //    if (!foundMessage) {
   //       return;
   //    }
   //    if (isVisible) {
   //       addVisibleMessage(foundMessage.id, moment(foundMessage.timestamp).valueOf(), channelId);
   //    } else {
   //       removeVisibleMessage(foundMessage.id);
   //    }
   // }

   useEffect(() => {
      return () => {
         clearVisibleMessages();
      };
   }, [channelId]);

   return { onMessageVisibilityChanged };
}
