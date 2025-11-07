import RangeInput from "@components/input/RangeInput";
import { useContextMenu } from "@stores/contextMenuStore";
import { useEffect, useMemo } from "react";
import ContextMenu from "./ContextMenu";
import { useStorage, useStorageStore } from "@stores/storageStore";
import { useClient } from "@stores/clientStore";
import { useVoiceUtils } from "@hooks/voice/useVoiceUtils";

export default function VoiceElementContextMenu() {
   const { data } = useContextMenu("voice_element");
   const client = useClient();
   const { consumeStream } = useVoiceUtils();

   const { saveFromCachedValue } = useStorageStore();
   const voicePreferences = useStorage("voice-preferences");

   const preference = useMemo(() => voicePreferences.find((x) => x.userId === data?.user.id), [voicePreferences]);

   const hasAudio = useMemo(
      () =>
         (data?.secondMediaSource?.kind === "stream_audio" && data.secondMediaSource?.type === "consuming") ||
         (data?.mediaSource.kind === "stream_audio" && data.mediaSource.type === "consuming"),
      [data],
   );

   const isConsuming = useMemo(() => (!data ? false : client?.voice.transport.getConsumer(data.user.id, data.mediaSource.kind)), [data]);

   function onChange(value: number) {
      if (!data) {
         return;
      }

      client?.voice.updateVoicePreference(
         data.user.id,
         data.mediaSource.kind === "microphone" ? { microphoneVolume: value } : { streamVolume: value },
      );
   }

   async function watch() {
      if (!data) {
         return;
      }

      await consumeStream(data.user.id);
   }

   useEffect(() => {
      return () => {
         saveFromCachedValue("voice-preferences");
      };
   }, []);

   if (!data || !preference) return;

   return (
      <>
         {data.mediaSource.kind === "microphone" && (
            <ContextMenu.Item
               label="Volume"
               className="items-start! focus:bg-inherit! mt-1 min-w-40 cursor-default flex-col gap-y-1 px-1"
               preventClose
            >
               <RangeInput minValue={0} maxValue={200} defaultValue={preference?.microphoneVolume} onChange={onChange} />
            </ContextMenu.Item>
         )}
         {(data.mediaSource.kind === "stream_video" || data.mediaSource.kind === "stream_audio") && (
            <>
               {isConsuming ? (
                  <ContextMenu.Item
                     label={data.mediaSource.kind === "stream_video" ? "Stop Watching" : "Stop Listening"}
                     color="negative"
                     onClick={() => client?.voice.transport.closeConsumer(data.mediaSource.consumerId!)}
                  />
               ) : (
                  <ContextMenu.Item label={data.mediaSource.kind === "stream_video" ? "Watch" : "Listen"} onClick={watch} />
               )}
               {hasAudio && (
                  <ContextMenu.Item
                     label="Stream Volume"
                     className="items-start! focus:bg-inherit! mt-1 min-w-40 cursor-default flex-col gap-y-1 px-1"
                     preventClose
                  >
                     <RangeInput minValue={0} maxValue={200} defaultValue={preference?.streamVolume} onChange={onChange} />
                  </ContextMenu.Item>
               )}
            </>
         )}
      </>
   );
}
