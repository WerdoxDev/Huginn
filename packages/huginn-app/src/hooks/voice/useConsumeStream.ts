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
         console.log("START");
         if (client.voice.connectionInfo && !client.voice.recvTransport) {
            console.log("WAITING");
            await client.voice.waitForEvents(["recv_transport_ready"]);
         }

         console.log("DONE WAITING");

         if (client.voice.status === "authenticated") {
            console.log("CONSUME");
            await voiceClient.consumeStream(data.userId);
            console.log("FINISH CONSUME");
         } else {
            console.log("CONNECT CONSUME");
            await voiceClient.connectAndConsumeStream(data.guildId, data.channelId, data.userId);
            console.log("FINISH CONNECT CONSUME");
         }
      },
   });

   return mutation;
}
