import type { Snowflake } from "@huginn/shared";

import { useClient } from "@stores/clientStore";
import { useThisUser } from "@stores/userStore";
import { useMutation } from "@tanstack/react-query";

export function useEditMessage() {
   const client = useClient();
   const { user } = useThisUser();

   const mutation = useMutation({
      mutationKey: ["edit-message"],
      async mutationFn(data: { channelId: Snowflake; messageId: Snowflake; content?: string }) {
         if (!user) {
            return;
         }

         return await client?.channels.editMessage(data.channelId, data.messageId, {
            content: data.content,
         });
      },
   });

   return mutation;
}
