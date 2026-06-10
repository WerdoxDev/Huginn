import type { Snowflake } from "@huginn/shared";

import { useClient } from "@stores/clientStore";
import { useMutation } from "@tanstack/react-query";
import { usePostHog } from "posthog-js/react";

export function useDeleteDMChannel() {
   const client = useClient();
   const posthog = usePostHog();

   const mutation = useMutation({
      mutationKey: ["delete-dm-channel"],
      async mutationFn(channelId: Snowflake) {
         posthog.capture("channel:dm_closed");
         return await client?.channels.deleteDM(channelId);
      },
   });

   return mutation;
}
