import { createStore, useStore } from "zustand";
import { combine } from "zustand/middleware";
import type { ThemeType } from "@/types";

export type AppSettings = {
   serverAddress: string;
   cdnAddress: string;
   voiceAddress: string;
   theme: ThemeType;
   inputDeviceId: string;
   outputDeviceId: string;
   inputVolume: number;
   outputVolume: number;
   inputThreshold: number;
   noiseSuppression: boolean,
   screenshareFramerate: number;
   screenshareResolution: number;
   screenshareAudio: boolean;
};

const initialStore = () =>
   ({
      serverAddress: "https://midgard.huginn.dev",
      cdnAddress: "https://midgard.huginn.dev",
      voiceAddress: "https://midgard.huginn.dev",
      theme: "pine green",
      inputDeviceId: "",
      outputDeviceId: "",
      inputThreshold: -50,
      inputVolume: 100,
      outputVolume: 100,
      noiseSuppression: true,
      screenshareFramerate: 0,
      screenshareResolution: 0,
      screenshareAudio: false
   }) as AppSettings;

let localStorageItem: string;

export async function initializeSettings() {
   localStorageItem = "settings";
   const initialValue = initialStore();

   if (window.electronAPI) {
      await window.electronAPI.trySaveDefaultSettings(JSON.stringify(initialValue));
      const settings = await window.electronAPI.loadSettings();
      store.setState({ ...initialValue, ...settings });
      return;
   }

   if (!window.localStorage.getItem(localStorageItem)) {
      window.localStorage.setItem(localStorageItem, JSON.stringify(initialValue));
   }
   // biome-ignore lint/style/noNonNullAssertion: the local storage item is checked before
   store.setState({ ...initialValue, ...JSON.parse(globalThis.localStorage.getItem(localStorageItem)!) });
}

const store = createStore(
   combine(initialStore(), (set, get) => ({
      setSettings: (settings: Partial<AppSettings>) => {
         const newSettings = { ...get(), ...settings }
         set({ ...newSettings });
      },
      saveSettings: async () => {
         const settings = get();
         if (window.electronAPI) {
            await window.electronAPI.saveSettings(JSON.stringify(settings));
         } else {
            globalThis.localStorage.setItem(localStorageItem, JSON.stringify(settings));
         }
      },
   })),
);

export function useSettings() {
   return useStore(store);
}

export const settingsStore = store;
