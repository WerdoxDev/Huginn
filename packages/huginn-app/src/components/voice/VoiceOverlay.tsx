import type { GatewayVoiceState } from "@huginnjs/shared";

import UserAvatar from "@components/UserAvatar";
import { getUserOptions } from "@lib/queries";
import { useStorage } from "@stores/storageStore";
import { useVoiceStore } from "@stores/voiceStore";
import { useQuery } from "@tanstack/react-query";
import clsx from "clsx";

export default function VoiceOverlay() {
   const { voiceState, voiceStates, speakingStates } = useVoiceStore();
   const settings = useStorage("settings");

   if (!voiceState.channelId || settings?.overlayEnabled === false) return null;

   function isSpeaking(state: GatewayVoiceState) {
      return (
         !state.isAudioMuted &&
         !state.isAudioDeafened &&
         speakingStates.some((speakingState) => speakingState.userId === state.userId && speakingState.speaking)
      );
   }

   return (
      <ul className="pointer-events-none absolute top-3 left-3 flex max-w-64 flex-col gap-y-1.5 select-none">
         {voiceStates
            .filter((state) => state.channelId === voiceState.channelId)
            .toSorted((a, b) => Number(isSpeaking(b)) - Number(isSpeaking(a)))
            .map((state) => (
               <VoiceOverlayParticipant
                  key={state.userId}
                  voiceState={state}
                  isSpeaking={isSpeaking(state)}
                  onlySpeaking={settings?.voiceOverlayOnlySpeaking ?? false}
               />
            ))}
      </ul>
   );
}

function VoiceOverlayParticipant({
   voiceState,
   isSpeaking,
   onlySpeaking,
}: {
   voiceState: GatewayVoiceState;
   isSpeaking: boolean;
   onlySpeaking: boolean;
}) {
   const { data: user } = useQuery(getUserOptions(voiceState.userId));
   const name = user?.displayName ?? user?.username ?? voiceState.userId;
   const speaking = isSpeaking && !voiceState.isAudioMuted && !voiceState.isAudioDeafened;
   const status = voiceState.isAudioDeafened ? "Deafened" : voiceState.isAudioMuted ? "Muted" : speaking ? "Speaking" : "Not speaking";

   return (
      <li aria-label={`${name}, ${status}`} className={clsx("flex min-w-0 items-center gap-x-2", onlySpeaking && !speaking && "opacity-0")}>
         <UserAvatar
            userId={voiceState.userId}
            avatarHash={user?.avatar}
            size={1.5}
            hideStatus
            animatedMode="never"
            className={clsx("rounded-full transition-colors", speaking ? "ring-positive-300 ring-2" : "opacity-50")}
         />
         <div
            className={clsx(
               "flex min-w-0 items-center gap-x-2 rounded-md px-2 py-1 transition-colors",
               speaking ? "bg-black text-white opacity-100" : "bg-black/50 text-white/70 opacity-50",
            )}
         >
            <div className="truncate text-xs font-medium">{name}</div>
            {voiceState.isAudioDeafened ? (
               <IconMingcuteVolumeOffFill className="text-negative-300 size-4 shrink-0" />
            ) : voiceState.isAudioMuted ? (
               <IconMingcuteMicOffFill className="text-negative-300 size-4 shrink-0" />
            ) : null}
         </div>
      </li>
   );
}
