import type { Snowflake } from "@huginn/shared";
import { useClient } from "@stores/clientStore";
import { voiceClient } from "@stores/voiceStore";
import { useMutation } from "@tanstack/react-query";

export type ConsumeStreamMutationVars = { guildId: Snowflake | null, channelId: Snowflake, userId: Snowflake }

export function useConsumeStream() {
   const client = useClient();

   const mutation = useMutation({
      mutationKey: ["consume-stream"],
      async mutationFn(data: ConsumeStreamMutationVars) {
         if (client.voice.status === "authenticated") {
            await voiceClient.consumeStream(data.userId);
         } else {
            await voiceClient.connectAndConsumeStream(data.guildId, data.channelId, data.userId);
         }
      },

   })

   return mutation;
}
