import { MessageType, type Snowflake } from "@huginn/shared";
import { useQueryClient, type InfiniteData } from "@tanstack/react-query";
import { useMemo } from "react";

import type { AppMessage } from "@/types";

export function useMessage(channelId: Snowflake, messageId?: Snowflake) {
   const queryClient = useQueryClient();

   return useMemo<AppMessage | undefined>(() => {
      const messages = queryClient.getQueryData<InfiniteData<AppMessage[]>>(["messages", channelId]);

      if (!messages || !messageId) return undefined;

      for (const message of messages.pages.flatMap((x) => x)) {
         if (message.id === messageId) {
            return message;
         }
         if (!message.isPreview && message.type === MessageType.REPLY && message.referencedMessage?.id === messageId) {
            return message.referencedMessage;
         }
      }
   }, [channelId, messageId]);
}
