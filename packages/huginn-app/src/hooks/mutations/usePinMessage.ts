import type { Snowflake } from "@huginn/shared";

import { useClient } from "@stores/clientStore";
import { useMutation } from "@tanstack/react-query";

export type PinMessageMutationVars = { channelId: Snowflake; messageId: Snowflake };

export function usePinMessage() {
   const client = useClient();

   return useMutation({
      mutationKey: ["pin-message"],
      async mutationFn(data: PinMessageMutationVars) {
         return await client?.channels.pinMessage(data.channelId, data.messageId);
      },
   });
}
