import type { Snowflake } from "@huginnjs/shared";

import { useClient } from "@stores/clientStore";
import { useThisUser } from "@stores/userStore";
import { useMutation } from "@tanstack/react-query";
import { usePostHog } from "posthog-js/react";

export function useDeleteMessage() {
   const client = useClient();
   const { user } = useThisUser();
   const posthog = usePostHog();

   const mutation = useMutation({
      mutationKey: ["delete-message"],
      async mutationFn(data: { channelId: Snowflake; messageId: Snowflake }) {
         if (!user) {
            return;
         }

         posthog.capture("message:deleted");
         return await client?.channels.deleteMessage(data.channelId, data.messageId);
      },
   });

   return mutation;
}
