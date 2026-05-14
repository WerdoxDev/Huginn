import { MessageType, type Snowflake } from "@huginn/shared";
import { getPinnedMessagesOptions } from "@lib/queries";
import { useClient } from "@stores/clientStore";
import { useQuery, useQueryClient, type InfiniteData } from "@tanstack/react-query";
import { useMemo } from "react";

import type { AppMessage } from "@/types";

export function useMessage(channelId: Snowflake, messageId?: Snowflake) {
   const queryClient = useQueryClient();

   return useMemo<AppMessage | undefined>(() => {
      const messages = queryClient.getQueryData<InfiniteData<AppMessage[]>>(["messages", channelId]);

      console.log("useMessage", { channelId, messageId, messages });
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

export function usePinnedMessages(channelId: Snowflake, options?: { enabled?: boolean; limit?: number }) {
   const client = useClient();

   return useQuery({
      ...getPinnedMessagesOptions(client!, channelId, options?.limit),
      enabled: options?.enabled ?? true,
      // refetchOnMount: "always",
      // staleTime: 0,
   });
}
