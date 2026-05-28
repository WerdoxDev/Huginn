import type { Snowflake } from "@huginn/shared";

import { useClient } from "@stores/clientStore";
import { useMutation } from "@tanstack/react-query";

export type UnpinMessageMutationVars = { channelId: Snowflake; messageId: Snowflake };

export function useUnpinMessage() {
   const client = useClient();

   return useMutation({
      mutationKey: ["unpin-message"],
      async mutationFn(data: UnpinMessageMutationVars) {
         return await client?.channels.unpinMessage(data.channelId, data.messageId);
      },
   });
}
