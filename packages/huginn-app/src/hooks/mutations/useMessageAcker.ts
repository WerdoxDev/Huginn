import { type Snowflake, snowflake } from "@huginn/shared";
import { useChannelStore } from "@stores/channelStore";
import { useClient } from "@stores/clientStore";
import { useChannelReadState, useReadStates } from "@stores/readStatesStore";
import { useThisUser } from "@stores/userStore";
import { useHuginnWindow } from "@stores/windowStore";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import moment from "moment";
import { useEffect } from "react";
import type { AppMessage } from "@/types";

export function useMessageAcker(channelId: Snowflake, messages: AppMessage[]) {
   const client = useClient();
   const queryClient = useQueryClient();
   const { user } = useThisUser();
   const readState = useChannelReadState(channelId);
   const { currentVisibleMessages } = useChannelStore();
   const { setLatestReadMessage } = useReadStates();
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
         const latestMessageId = currentVisibleMessages
            .toSorted((a, b) => {
               const x = BigInt(a.messageId);
               const y = BigInt(b.messageId);
               return x < y ? -1 : x > y ? 1 : 0;
            })
            .at(-1)?.messageId;

         if (!latestMessageId) {
            return;
         }

         const latestMessage = messages.find((x) => x.id === latestMessageId);
         if (!latestMessage) {
            return;
         }

         // if the latest message is from the user or the message is older than the last read message, don't send an ack
         if (
            (!readState?.lastReadMessageId || BigInt(readState.lastReadMessageId) < BigInt(latestMessageId)) &&
            user?.id !== latestMessage.authorId
         ) {
            setLatestReadMessage(channelId, latestMessage.id, queryClient);
            await mutation.mutateAsync({ channelId: channelId, messageId: latestMessage.id });
         }
      }

      trySendAck();
   }, [currentVisibleMessages, huginnWindow.focused, messages]);
}
