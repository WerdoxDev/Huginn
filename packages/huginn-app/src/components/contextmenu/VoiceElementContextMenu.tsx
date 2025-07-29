import RangeInput from "@components/input/RangeInput";
import { useClient } from "@stores/clientStore";
import { useContextMenu } from "@stores/contextMenuStore";
import { useVoiceStore, voiceClient } from "@stores/voiceStore";
import { useEffect, useMemo } from "react";
import ContextMenu from "./ContextMenu";

export default function VoiceElementContextMenu() {
   const { data } = useContextMenu("voice_element");
   const client = useClient();
   const { updateVoicePreferences, voicePreferences, remoteSources, saveVoicePreferences } = useVoiceStore();

   const preference = useMemo(() => voicePreferences.find((x) => x.userId === data?.user.id), [voicePreferences]);

   const hasAudio = useMemo(
      () =>
         (data?.kind === "stream_video" && remoteSources.some((x) => x.kind === "stream_audio" && x.userId === data.user.id)) ||
         data?.kind === "stream_audio",
      [remoteSources, data],
   );

   const isWatching = useMemo(() => remoteSources.some((x) => x.producerId === data?.producerId && data.consumerId), [data, remoteSources]);

   function onChange(value: number) {
      if (!data) {
         return;
      }

      updateVoicePreferences(data.user.id, data.kind === "microphone" ? { microphoneVolume: value } : { screenShareVolume: value });
   }

   async function watch() {
      if (!data) {
         return;
      }

      if (client.voice.status === "rtc_ready") {
         await voiceClient.consumeStream(data.user.id);
      } else {
         await voiceClient.connectAndConsumeStream(null, data?.channelId, data?.user.id);
      }
   }

   useEffect(() => {
      return () => {
         saveVoicePreferences();
      };
   }, []);

   if (!data || !preference) return;

   return (
      <>
         {data.kind === "microphone" && (
            <ContextMenu.Item
               label="Volume"
               className="mt-1 min-w-40 cursor-default flex-col !items-start gap-y-1 px-1 focus:!bg-inherit"
               preventClose
            >
               <RangeInput minValue={0} maxValue={200} defaultValue={preference?.microphoneVolume} onChange={onChange} />
            </ContextMenu.Item>
         )}
         {(data.kind === "stream_video" || data.kind === "stream_audio") && (
            <>
               {isWatching ? (
                  <ContextMenu.Item
                     label={data.kind === "stream_video" ? "Stop Watching" : "Stop Listening"}
                     color="negative"
                     onClick={() => voiceClient.unconsumeStream(data.user.id)}
                  />
               ) : (
                  <ContextMenu.Item label="Watch" onClick={watch} />
               )}
               {hasAudio && (
                  <ContextMenu.Item
                     label="Stream Volume"
                     className="mt-1 min-w-40 cursor-default flex-col !items-start gap-y-1 px-1 focus:!bg-inherit"
                     preventClose
                  >
                     <RangeInput minValue={0} maxValue={200} defaultValue={preference?.screenShareVolume} onChange={onChange} />
                  </ContextMenu.Item>
               )}
            </>
         )}
      </>
   );
}
