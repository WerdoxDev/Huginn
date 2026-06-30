import { useClient } from "@stores/clientStore";
import { useMutation } from "@tanstack/react-query";

export function useAddReaction() {
   const client = useClient();

   return useMutation({
      mutationKey: ["add-reaction"],
      async mutationFn(data: { channelId: string; messageId: string; emojiId: string | null; emojiName: string }) {
         return await client?.messages.createReaction(data.channelId, data.messageId, data.emojiId, data.emojiName);
      },
   });
}
