import type { Snowflake, VoicePreference } from "@huginnjs/shared";

import { VoiceClient } from "@lib/voice/voice-client";
import { clientStore } from "@stores/clientStore";
import { useThrottledCallback } from "@tanstack/react-pacer";
import { useCallback } from "react";
import { useStore } from "zustand";

import { useEditSettings } from "./mutations/useEditSettings";

export function useVoicePreferences() {
   const voicePreferences = useStore(clientStore, (state) => state.userSettings?.voicePreferences);
   const mutation = useEditSettings();

   const updateVoicePreferences = useThrottledCallback(
      async (voicePreferences: VoicePreference[]) => {
         await mutation.mutateAsync({ voicePreferences });
      },
      { wait: 2000 },
   );

   const setUserPreference = useCallback(
      async (userId: Snowflake, options: Partial<Omit<VoicePreference, "userId">>) => {
         const updatedVoicePreferences = await VoiceClient.sendMessage("update_voice_preference", { userId, ...options });

         // throttled update to server
         updateVoicePreferences(updatedVoicePreferences);
      },
      [updateVoicePreferences],
   );

   return { voicePreferences, setUserPreference };
}
