import { type Snowflake } from "@huginnjs/shared";
import { useChannelStore } from "@stores/channelStore";
import { useClient } from "@stores/clientStore";
import { useChannelReadState, useReadStates } from "@stores/readStateStore";
import { useThisUser } from "@stores/userStore";
import { useHuginnWindow } from "@stores/windowStore";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

import type { AppMessage } from "@/types";

export function useMessageAcker(channelId: Snowflake, messages: AppMessage[]) {
   const client = useClient();
   const queryClient = useQueryClient();
   const { user } = useThisUser();
   const readState = useChannelReadState(channelId);
   const { currentVisibleMessages } = useChannelStore();
   const { setLatestReadMessage, setReadState } = useReadStates();
   const huginnWindow = useHuginnWindow();

   const mutation = useMutation({
      async mutationFn(data: { channelId: Snowflake; messageId: Snowflake }) {
         await client?.channels.ackMessage(data.channelId, data.messageId);
      },
   });

   useEffect(() => {
      if (!huginnWindow.focused) {
         return;
      }

      async function trySendAck() {
         const sortedVisible = currentVisibleMessages.toSorted((a, b) => {
            const x = BigInt(a.messageId);
            const y = BigInt(b.messageId);
            return x < y ? -1 : x > y ? 1 : 0;
         });

         // Find the latest visible message authored by someone other than the current user.
         // Acking the user's own message would skip marking any preceding messages from others as read.
         const latestVisibleOtherMessage = sortedVisible
            .map((x) => messages.find((m) => m.id === x.messageId))
            .filter((m): m is AppMessage => m !== undefined && m.authorId !== user?.id)
            .at(-1);

         if (!latestVisibleOtherMessage) {
            return;
         }

         if (!readState?.lastReadMessageId || BigInt(readState.lastReadMessageId) < BigInt(latestVisibleOtherMessage.id)) {
            const previousState = readState ? { ...readState } : undefined;
            setLatestReadMessage(channelId, latestVisibleOtherMessage.id, queryClient, user?.id);
            try {
               await mutation.mutateAsync({
                  channelId,
                  messageId: latestVisibleOtherMessage.id,
               });
            } catch {
               // Rollback optimistic update if the ack request fails
               if (previousState) {
                  setReadState(previousState);
               }
            }
         }
      }

      trySendAck();
   }, [currentVisibleMessages, huginnWindow.focused, messages]);
}
