import { useClient } from "@contexts/apiContext";
import { Snowflake } from "@shared/snowflake";
import { useMutation } from "@tanstack/react-query";

export function useRemoveChannel() {
   const client = useClient();

   const mutation = useMutation({
      async mutationFn(channelId: Snowflake) {
         await client.channels.removeDm(channelId);
      },
   });

   async function removeChannel(channelId: Snowflake) {
      await mutation.mutateAsync(channelId);
   }

   return removeChannel;
}
