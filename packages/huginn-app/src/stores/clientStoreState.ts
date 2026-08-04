import type { HuginnClient, VoiceStatus } from "@huginnjs/api";
import type { GatewayReadyData, GatewayStatus, UserSettings } from "@huginnjs/shared";
import { syncZustandStore } from "@lib/sync-zustand";
import { createStore } from "zustand";
import { combine, subscribeWithSelector } from "zustand/middleware";

import type { VoiceBridge } from "@lib/voice/voice-bridge";

const initialStore = () => ({
   hostnames: {
      api: "",
      cdn: "",
      voice: "",
   },
   voiceStatus: undefined as VoiceStatus | undefined,
   gatewayStatus: undefined as GatewayStatus | undefined,
   readyData: undefined as GatewayReadyData | undefined,
   isInitialized: false,
   userSettings: undefined as UserSettings | undefined,
   client: undefined as HuginnClient<VoiceBridge> | undefined,
   readyCount: 0,
   androidUpdateUrl: undefined as string | undefined,
});

export const clientStore = createStore(
   subscribeWithSelector(
      combine(initialStore(), (set) => ({
         setUserSettings: (settings: Partial<UserSettings>) =>
            set((state) => ({ userSettings: state.userSettings ? { ...state.userSettings, ...settings } : undefined })),
      })),
   ),
);

syncZustandStore(clientStore, {
   name: "clientStore",
   partialize: (state) => ({
      hostnames: state.hostnames,
      voiceStatus: state.voiceStatus,
      gatewayStatus: state.gatewayStatus,
      readyData: state.readyData,
      isInitialized: state.isInitialized,
      userSettings: state.userSettings,
      readyCount: state.readyCount,
      androidUpdateUrl: state.androidUpdateUrl,
   }),
});
