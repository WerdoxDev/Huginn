import type { Snowflake } from "@huginn/shared";

import { useClient } from "@stores/clientStore";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export type PinMessageMutationVars = { channelId: Snowflake; messageId: Snowflake };

export function usePinMessage() {
   const client = useClient();
   const queryClient = useQueryClient();

   return useMutation({
      mutationKey: ["pin-message"],
      async mutationFn(data: PinMessageMutationVars) {
         return await client?.channels.pinMessage(data.channelId, data.messageId);
      },
      // onSuccess(_data, vars) {
      //    queryClient.invalidateQueries({ queryKey: ["pinned-messages", vars.channelId] });
      // },
   });
}
