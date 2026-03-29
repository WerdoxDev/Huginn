import type { HMediaKind } from "@huginn/shared";

import HuginnRange from "@components/input/HuginnRange";
import { useVoiceUtils } from "@hooks/voice/useVoiceUtils";
import { useClient } from "@stores/clientStore";
import { useContextMenu } from "@stores/contextMenuStore";
import { useModals } from "@stores/modalsStore";
import { useStorage, useStorageStore } from "@stores/storageStore";
import { useEffect, useMemo } from "react";

import ContextMenu from "./ContextMenu";

export default function VoiceElementContextMenu() {
   const { data } = useContextMenu("voice_element");
   const client = useClient();
   const { consumeStream, unconsumeStream } = useVoiceUtils();
   const { updateModals } = useModals();

   const { saveFromCachedValue } = useStorageStore();
   const voicePreferences = useStorage("voice-preferences");

   const preference = useMemo(() => voicePreferences.find((x) => x.userId === data?.user.id), [voicePreferences]);

   const mediaSources = useMemo(
      () =>
         [data?.mediaSource, data?.secondMediaSource].filter(
            (x) => x && (["microphone", "stream_audio", "stream_video", "camera"] as HMediaKind[]).includes(x.kind),
         ),
      [data?.mediaSource, data?.secondMediaSource],
   );

   const hasAudio = useMemo(() => mediaSources.some((x) => x?.kind === "stream_audio" && x.type === "consuming"), [mediaSources]);
   const isConsuming = useMemo(() => mediaSources.every((x) => x?.type === "consuming"), [mediaSources]);

   function onChange(value: number) {
      if (!data) {
         return;
      }

      client?.voice.updateVoicePreference(
         data.user.id,
         mediaSources.some((x) => x?.kind === "microphone") ? { microphoneVolume: value } : { streamVolume: value },
      );
   }

   async function consume() {
      if (!data) {
         return;
      }

      await consumeStream(data.user.id, data.guildId, data.channelId);
   }

   async function unconsume() {
      if (!data) {
         return;
      }

      await unconsumeStream(data.user.id);
   }

   useEffect(() => {
      return () => {
         saveFromCachedValue("voice-preferences");
      };
   }, []);

   if (!data || !preference) return;

   return (
      <>
         <ContextMenu.Item
            label="View Profile"
            onClick={() => {
               updateModals({ userProfile: { isOpen: true, userId: data.user.id } });
            }}
         />
         {mediaSources.some((x) => x?.kind === "microphone") && (
            <ContextMenu.Item
               label="Volume"
               className="mt-1 min-w-40 cursor-default flex-col items-start! gap-y-1 px-1 focus:bg-inherit!"
               preventClose
            >
               <HuginnRange
                  minValue={0}
                  maxValue={200}
                  defaultValue={preference?.microphoneVolume}
                  onChange={onChange}
                  getTooltipText={(v) => `${v}%`}
               >
                  <HuginnRange.Input />
               </HuginnRange>
            </ContextMenu.Item>
         )}
         {mediaSources.some((x) => x?.kind === "stream_video" || x?.kind === "stream_audio") && (
            <>
               {isConsuming ? (
                  <ContextMenu.Item
                     label={mediaSources.some((x) => x?.kind === "stream_video") ? "Stop Watching" : "Stop Listening"}
                     color="negative"
                     onClick={unconsume}
                  />
               ) : (
                  <ContextMenu.Item label={mediaSources.some((x) => x?.kind === "stream_video") ? "Watch" : "Listen"} onClick={consume} />
               )}
               {hasAudio && (
                  <ContextMenu.Item
                     label="Stream Volume"
                     className="mt-1 min-w-40 cursor-default flex-col items-start! gap-y-1 px-1 focus:bg-inherit!"
                     preventClose
                  >
                     <HuginnRange
                        minValue={0}
                        maxValue={200}
                        defaultValue={preference?.streamVolume}
                        onChange={onChange}
                        getTooltipText={(v) => `${v}%`}
                     >
                        <HuginnRange.Input />
                     </HuginnRange>
                  </ContextMenu.Item>
               )}
            </>
         )}
      </>
   );
}
