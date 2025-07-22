import { fileExists, loadFile, saveFile } from "@lib/file-manager";
import { createStore, useStore } from "zustand";
import { combine } from "zustand/middleware";
import type { AppSettings } from "@/types";

const initialStore = () =>
({
   local: {
      apiHostname: "https://midgard.huginn.dev",
      cdnHostname: "https://midgard.huginn.dev",
      voiceHostname: "https://midgard.huginn.dev",
      hostnameSource: "manual",
      externalHostnamesUrl: "",
      theme: "pine green",
      inputDeviceId: "",
      outputDeviceId: "",
      videoDeviceId: "",
      inputThreshold: -50,
      inputVolume: 100,
      outputVolume: 100,
      noiseSuppression: true,
      screenshareFramerate: 0,
      screenshareQuality: 0,
      screenshareAudio: false
   } as AppSettings
});

export async function initializeSettings() {
   const initialValue = initialStore();

   const exists = await fileExists("settings");
   if (!exists) {
      await saveFile("settings", initialValue.local);
   }

   const settings = await loadFile("settings", undefined);
   store.setState({ local: settings });
}

const store = createStore(
   combine(initialStore(), (set, get) => ({
      setSettings: (settings: Partial<AppSettings>) =>
         set((state) => ({ local: { ...state.local, ...settings } })),
      saveSettings: async () => {
         const settings = get();
         await saveFile("settings", { ...settings.local });
      },
   })),
);

export function useSettings() {
   return useStore(store);
}

export const settingsStore = store;
