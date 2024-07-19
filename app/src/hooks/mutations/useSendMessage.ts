import { useClient } from "@contexts/apiContext";
import { MessageFlags } from "@shared/api-types";
import { Snowflake } from "@shared/snowflake";
import { useMutation } from "@tanstack/react-query";

export function useSendMessage() {
   const client = useClient();

   const mutation = useMutation({
      async mutationFn(data: { channelId: Snowflake; content: string; flags: MessageFlags }) {
         return await client.channels.createMessage(data.channelId, {
            content: data.content,
            flags: data.flags,
            nonce: client.generateNonce(),
         });
      },
   });

   return mutation;
}
