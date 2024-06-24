import { useClient } from "@contexts/apiContext";
import { Snowflake } from "@shared/snowflake";
import { useMutation } from "@tanstack/react-query";

export function useSendMessage() {
   const client = useClient();

   const mutation = useMutation({
      async mutationFn(data: { channelId: Snowflake; content: string }) {
         return await client.channels.createMessage(data.channelId, { content: data.content, nonce: client.generateNonce() });
      },
   });

   return mutation;
}
