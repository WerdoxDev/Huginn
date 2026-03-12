import type { Snowflake } from "@huginn/shared";

import { useClient } from "@stores/clientStore";
import { useThisUser } from "@stores/userStore";
import { useMutation } from "@tanstack/react-query";

export function useDeleteMessage() {
   const client = useClient();
   const { user } = useThisUser();

   const mutation = useMutation({
      mutationKey: ["delete-message"],
      async mutationFn(data: { channelId: Snowflake; messageId: Snowflake }) {
         if (!user) {
            return;
         }

         return await client?.channels.deleteMessage(data.channelId, data.messageId);
      },
   });

   return mutation;
}
