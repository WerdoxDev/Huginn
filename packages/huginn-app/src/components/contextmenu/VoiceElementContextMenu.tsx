import type { HMediaKind } from "@huginn/shared";

import HuginnCheckbox from "@components/HuginnCheckbox";
import HuginnSlider from "@components/input/HuginnSlider";
import { useVoicePreferences } from "@hooks/useVoicePreferences";
import { useVoiceUtils } from "@hooks/voice/useVoiceUtils";
import { useContextMenu } from "@stores/contextMenuStore";
import { useModals } from "@stores/modalsStore";
import { useMemo } from "react";

import ContextMenu from "./ContextMenu";

export default function VoiceElementContextMenu() {
   const { data } = useContextMenu("voice_element");
   const { consumeStream, unconsumeStream } = useVoiceUtils();
   const { updateModals } = useModals();

   const { voicePreferences, setUserPreference } = useVoicePreferences();

   const preference = useMemo(() => voicePreferences?.find((x) => x.userId === data?.user.id), [voicePreferences]);

   const mediaSources = useMemo(
      () =>
         [data?.mediaSource, data?.secondMediaSource].filter(
            (x) => x && (["microphone", "stream_audio", "stream_video", "camera"] as HMediaKind[]).includes(x.kind),
         ),
      [data?.mediaSource, data?.secondMediaSource],
   );

   const hasAudio = useMemo(() => mediaSources.some((x) => x?.kind === "stream_audio" && x.type === "consuming"), [mediaSources]);
   const isConsuming = useMemo(() => mediaSources.every((x) => x?.type === "consuming"), [mediaSources]);

   function handleVolumeChange(value: number) {
      if (!data) return;

      setUserPreference(data.user.id, mediaSources.some((x) => x?.kind === "microphone") ? { microphoneVolume: value } : { streamVolume: value });
   }

   function handleMuteChange(checked: boolean) {
      if (!data) return;

      setUserPreference(
         data.user.id,
         mediaSources.some((x) => x?.kind === "microphone") ? { isMicrophoneMuted: checked } : { isStreamMuted: checked },
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
            <>
               <ContextMenu.Item label="Volume" className="mt-1 min-w-40 flex-col items-start! gap-y-1 px-1" preventClose>
                  <HuginnSlider
                     minValue={0}
                     maxValue={200}
                     defaultValue={preference?.microphoneVolume}
                     onChange={handleVolumeChange}
                     getTooltipText={(v) => `${v}%`}
                  >
                     <HuginnSlider.Input backgroundClassName="bg-surface!" />
                  </HuginnSlider>
               </ContextMenu.Item>
               <ContextMenu.Item label="Muted" preventClose className="py-1!" onClick={() => handleMuteChange(!preference.isMicrophoneMuted)}>
                  <HuginnCheckbox checked={preference.isMicrophoneMuted}>
                     <HuginnCheckbox.Input innerClassName="bg-surface!" onClick={(e) => e.stopPropagation()} />
                  </HuginnCheckbox>
               </ContextMenu.Item>
            </>
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
                  <ContextMenu.Item label="Stream Volume" className="mt-1 min-w-40 flex-col items-start! gap-y-1 px-1" preventClose>
                     <HuginnSlider
                        minValue={0}
                        maxValue={200}
                        defaultValue={preference?.streamVolume}
                        onChange={handleVolumeChange}
                        getTooltipText={(v) => `${v}%`}
                     >
                        <HuginnSlider.Input backgroundClassName="bg-surface!" />
                     </HuginnSlider>
                  </ContextMenu.Item>
               )}
            </>
         )}
      </>
   );
}
