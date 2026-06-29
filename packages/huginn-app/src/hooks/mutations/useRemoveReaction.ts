import { useClient } from "@stores/clientStore";
import { useMutation } from "@tanstack/react-query";

export function useRemoveReaction() {
   const client = useClient();

   return useMutation({
      mutationKey: ["remove-reaction"],
      async mutationFn(data: { channelId: string; messageId: string; emojiId: string | null; emojiName: string }) {
         return await client?.messages.removeReaction(data.channelId, data.messageId, data.emojiId, data.emojiName);
      },
   });
}
