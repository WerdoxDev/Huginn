import type { Snowflake } from "@huginn/shared";
import { useClient } from "@stores/clientStore";
import { voiceClient } from "@stores/voiceStore";
import { useMutation } from "@tanstack/react-query";

export function useWatchScreenshare() {
   const client = useClient();

   const mutation = useMutation({
      mutationKey: ["watch-screenshare"],
      async mutationFn(data: { guildId: Snowflake | null, channelId: Snowflake, userId: Snowflake }) {
         if (client.voice.status === "authenticated") {
            await voiceClient.watchScreenshare(data.userId);
         } else {
            await voiceClient.connectAndWatchStream(data.guildId, data.channelId, data.userId);
         }
      },

   })

   return mutation;
}
