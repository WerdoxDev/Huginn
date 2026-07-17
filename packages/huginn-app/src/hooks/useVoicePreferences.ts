import type { Snowflake, VoicePreference } from "@huginn/shared";

import { clientStore, useClient, useClientStore } from "@stores/clientStore";
import { produce } from "immer";
import { useCallback } from "react";
import { useStore } from "zustand";

import { useEditSettings } from "./mutations/useEditSettings";
import { useThrottler } from "./useThrottler";

export function useVoicePreferences() {
   const voicePreferences = useStore(clientStore, (state) => state.userSettings?.voicePreferences);
   const { setUserSettings } = useClientStore();
   const client = useClient();
   const mutation = useEditSettings();

   const { throttledFunction } = useThrottler(async (voicePreferences: VoicePreference[]) => {
      await mutation.mutateAsync({ voicePreferences: voicePreferences });
   }, 2000);

   const setUserPreference = useCallback(
      async (userId: Snowflake, options: Partial<Omit<VoicePreference, "userId">>) => {
         const updatedVoicePreferences = produce(voicePreferences, (draft) => {
            const existingIndex = draft?.findIndex((x) => x.userId === userId);

            if (existingIndex !== undefined && existingIndex !== -1 && draft) {
               draft[existingIndex] = { ...draft[existingIndex], ...options };
            } else {
               if (options.microphoneVolume === undefined || options.streamVolume === undefined) {
                  throw new Error("Creating new voice preference requires both microphone and screen share volumes");
               }

               if (!draft) draft = [];

               draft.push({
                  userId,
                  microphoneVolume: options.microphoneVolume,
                  streamVolume: options.streamVolume,
                  isMicrophoneMuted: options.isMicrophoneMuted ?? false,
                  isStreamMuted: options.isStreamMuted ?? false,
               });
            }
         });

         if (!updatedVoicePreferences) return;

         // optimistic update
         setUserSettings({ voicePreferences: updatedVoicePreferences });
         // throttled update to server
         throttledFunction(updatedVoicePreferences);
      },
      [client, voicePreferences],
   );

   return { voicePreferences, setUserPreference };
}
