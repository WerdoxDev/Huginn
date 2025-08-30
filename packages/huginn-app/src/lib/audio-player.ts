import notificationUrl from "@/assets/sounds/notification.wav";
import voiceEnterUrl from "@/assets/sounds/voice-enter.wav";
import voiceLeaveUrl from "@/assets/sounds/voice-leave.wav";
import { presenceStore } from "@stores/presenceStore";

export type AudioType = "notification" | "voice-enter" | "voice-leave";

const urls: Record<AudioType, string> = { "voice-enter": voiceEnterUrl, "voice-leave": voiceLeaveUrl, notification: notificationUrl } as const;

export function playAudio(type: AudioType, respectStatus?: boolean) {
   const thisPresence = presenceStore.getState().thisPresence;
   console.log(thisPresence);
   if (thisPresence.status === "dnd" && respectStatus) {
      return;
   }

   const audio = new Audio(urls[type]);
   audio.play();
}
