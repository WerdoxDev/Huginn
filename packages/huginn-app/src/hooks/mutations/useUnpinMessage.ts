import type { Snowflake } from "@huginn/shared";

import { useClient } from "@stores/clientStore";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export type UnpinMessageMutationVars = { channelId: Snowflake; messageId: Snowflake };

export function useUnpinMessage() {
   const client = useClient();
   const queryClient = useQueryClient();

   return useMutation({
      mutationKey: ["unpin-message"],
      async mutationFn(data: UnpinMessageMutationVars) {
         return await client?.channels.unpinMessage(data.channelId, data.messageId);
      },
      // onSuccess(_data, vars) {
      //    queryClient.invalidateQueries({ queryKey: ["pinned-messages", vars.channelId] });
      // },
   });
}
