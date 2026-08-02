import type { Snowflake, VoicePreference } from "@huginnjs/shared";

import { VoiceClient } from "@lib/voice/voice-client";
import { clientStore, useClient, useClientStore } from "@stores/clientStore";
import { useCallback } from "react";
import { useStore } from "zustand";

import { useEditSettings } from "./mutations/useEditSettings";
import { useThrottler } from "./useThrottler";

export function useVoicePreferences() {
   const voicePreferences = useStore(clientStore, (state) => state.userSettings?.voicePreferences);
   const client = useClient();
   const mutation = useEditSettings();

   const { throttledFunction } = useThrottler(async (voicePreferences: VoicePreference[]) => {
      await mutation.mutateAsync({ voicePreferences: voicePreferences });
   }, 2000);

   const setUserPreference = useCallback(
      async (userId: Snowflake, options: Partial<Omit<VoicePreference, "userId">>) => {
         const updatedVoicePreferences = await VoiceClient.sendMessage("update_voice_preference", { userId, ...options });

         // throttled update to server
         throttledFunction(updatedVoicePreferences);
      },
      [client, voicePreferences],
   );

   return { voicePreferences, setUserPreference };
}
