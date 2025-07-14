import { error } from "@huginn/shared";
import { messages } from "@lib/error-messages";
import { createStore, useStore } from "zustand";
import { combine } from "zustand/middleware";
import type { ThemeType } from "@/types";
import { apiStore } from "./apiStore";
import { modalsStore } from "./modalsStore";

export type AppSettings = {
   apiHostname: string;
   cdnHostname: string;
   voiceHostname: string;
   externalUrl: string;
   hostnameMode: "manual" | "external"
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
      apiHostname: "https://midgard.huginn.dev",
      cdnHostname: "https://midgard.huginn.dev",
      voiceHostname: "https://midgard.huginn.dev",
      hostnameMode: "manual",
      externalUrl: "",
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
   } else if (!window.localStorage.getItem(localStorageItem)) {
      window.localStorage.setItem(localStorageItem, JSON.stringify(initialValue));
      // biome-ignore lint/style/noNonNullAssertion: the local storage item is checked before
      store.setState({ ...initialValue, ...JSON.parse(globalThis.localStorage.getItem(localStorageItem)!) });
   }

   const thisStore = store.getState();
   if (thisStore.hostnameMode === "manual") {
      apiStore.setState({ hostnames: { api: thisStore.apiHostname, cdn: thisStore.cdnHostname, voice: thisStore.voiceHostname } });
   } else {
      let response: Response | undefined;
      try {
         response = (await fetch(thisStore.externalUrl, { cache: "no-cache" }));
         const json = await response?.json();
         apiStore.setState({ hostnames: { api: json.api, cdn: json.cdn, voice: json.voice } });
      } catch (e) {
         error("app:settings-store", "Error fetching external hostnames", e);

         modalsStore.getState().updateModals({ info: { isOpen: true, ...messages.externalUrlError(), status: "error" } })
      }
   }

   if (window.electronAPI) {
      const url = `${apiStore.getState().hostnames.api}/api/update/win`;
      window.electronAPI.setUpdateUrl(url);
   }
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
