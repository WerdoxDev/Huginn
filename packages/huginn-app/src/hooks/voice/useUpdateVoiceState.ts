import type { GatewayVoiceStateFlags } from "@huginn/shared";
import { useClient } from "@stores/clientStore";
import { useMutation } from "@tanstack/react-query";

export function useUpdateVoiceState() {
   const client = useClient();

   const mutation = useMutation({
      mutationKey: ["update-voice-state"],
      async mutationFn(data: GatewayVoiceStateFlags) {
         await client.gateway.updateVoiceState(data);
      },
      scope: { id: "update-voice-state" }
   })

   return mutation;
}
