import type { GatewayVoiceState } from "@huginnjs/shared";

import UserAvatar from "@components/UserAvatar";
import { getUserOptions } from "@lib/queries";
import { useVoiceStore } from "@stores/voiceStore";
import { useQuery } from "@tanstack/react-query";
import clsx from "clsx";

export default function VoiceOverlay() {
   const { voiceState, voiceStates, speakingStates } = useVoiceStore();

   if (!voiceState.channelId) return null;

   return (
      <ul className="pointer-events-none absolute top-3 left-3 flex max-w-64 flex-col gap-y-1.5 select-none">
         {voiceStates
            .filter((state) => state.channelId === voiceState.channelId)
            .map((state) => (
               <VoiceOverlayParticipant
                  key={state.userId}
                  voiceState={state}
                  isSpeaking={speakingStates.some((speakingState) => speakingState.userId === state.userId && speakingState.speaking)}
               />
            ))}
      </ul>
   );
}

function VoiceOverlayParticipant({ voiceState, isSpeaking }: { voiceState: GatewayVoiceState; isSpeaking: boolean }) {
   const { data: user } = useQuery(getUserOptions(voiceState.userId));
   const name = user?.displayName ?? user?.username ?? voiceState.userId;
   const speaking = isSpeaking && !voiceState.isAudioMuted && !voiceState.isAudioDeafened;

   return (
      <li className="flex min-w-0 items-center gap-x-2">
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
