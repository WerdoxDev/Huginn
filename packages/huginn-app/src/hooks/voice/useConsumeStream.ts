import type { Snowflake } from "@huginn/shared";
import { useClient } from "@stores/clientStore";
import { voiceClient } from "@stores/voiceStore";
import { useMutation } from "@tanstack/react-query";

export type ConsumeStreamMutationVars = { guildId: Snowflake | null; channelId: Snowflake; userId: Snowflake };

export function useConsumeStream() {
   const client = useClient();

   const mutation = useMutation({
      mutationKey: ["consume-stream"],
      async mutationFn(data: ConsumeStreamMutationVars) {
         // It's connecting...
         if (client.voice.status !== "rtc_ready" && client.voice.connectionInfo?.channelId === data.channelId) {
            await client.voice.waitForEvents(["ready"]);
         }
         // Not connected. So connect...
         else if (!client.voice.connectionInfo || client.voice.connectionInfo.channelId !== data.channelId) {
            await voiceClient.connect(data.guildId, data.channelId);
         }

         console.log(client.voice.status);

         await voiceClient.consumeStream(data.userId);
      },
   });

   return mutation;
}
