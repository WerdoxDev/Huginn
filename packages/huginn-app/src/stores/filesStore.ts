import { fileExists, loadFile, saveFile } from "@lib/file-manager";
import { createStore, useStore } from "zustand";
import { combine } from "zustand/middleware";
import type { AppSettings, Keybind, VoicePreference } from "@/types";
import { error, log, type APIGetKnownApplicationsResult, type Snowflake } from "@huginn/shared";
import { produce } from "immer";
import { dispatchEvent } from "@lib/event-handler";
import { clientStore } from "./clientStore";

const initialStore = () => ({
   settings: {
      apiHostname: "https://midgard.huginn.dev",
      cdnHostname: "https://midgard.huginn.dev",
      voiceHostname: "https://midgard.huginn.dev",
      hostnameSource: "manual",
      externalHostnamesUrl: "",
      theme: "pine green",
      inputDeviceId: "",
      outputDeviceId: "",
      cameraDeviceId: "",
      inputThreshold: -50,
      inputVolume: 100,
      outputVolume: 100,
      noiseSuppression: true,
      screenShareFramerate: 0,
      screenShareQuality: 0,
      screenShareAudio: false,
   } as AppSettings,
   keybinds: [
      { type: "toggle_deafen", combination: [], isEnabled: true },
      { type: "toggle_mute", combination: [], isEnabled: true },
   ] as Keybind[],
   voicePreferences: [] as VoicePreference[],
   knownApplications: {} as APIGetKnownApplicationsResult,
});

type StoreType = ReturnType<typeof initialStore>;

export async function initializeFiles() {
   const initialValue = initialStore();

   const settingsExists = await fileExists("settings");
   if (!settingsExists) {
      await saveFile("settings", initialValue.settings);
   }

   const keybindsExists = await fileExists("keybinds");
   if (!keybindsExists) {
      await saveFile("keybinds", initialValue.keybinds);
   }

   const settings = await loadFile("settings", undefined);
   store.setState({ settings: settings });

   const voicePreferences = await loadFile("voice-preferences", []);
   store.setState({ voicePreferences: voicePreferences });

   const keybinds = await loadFile("keybinds", []);
   store.setState({ keybinds: keybinds });
}

export function initializeFilesWithClient() {
   const client = clientStore.getState().client;

   const unlisten = client?.gateway.listen("ready", async () => {
      const knownApplicationsExists = await fileExists("known-applications");
      if (!knownApplicationsExists) {
         const result = await client?.applications.getKnown();
         await saveFile("known-applications", result);
      } else {
         const file = await loadFile("known-applications", undefined)!;
         const result = await client?.applications.getKnown(new Date(file?.lastUpdated ?? ""));

         if (!file) {
            error("app:files-store", "File store should not have been null here");
            return;
         }

         for (const application of result.applications) {
            const existingIndex = file?.applications.findIndex((x) => x.id === application.id);

            // Remove the application if it's deleted in the new list
            if (application.deletedAt) {
               console.log("delete", application.id);
               file.applications = file.applications.filter((x) => x.id !== application.id);
               continue;
            }

            // Update any updated applications
            if (existingIndex !== -1) {
               file.applications[existingIndex] = application;
            }
            // Add any new ones
            else {
               file.applications.push(application);
            }
         }

         file.lastUpdated = result.lastUpdated;

         await saveFile("known-applications", file);
      }
   });

   return () => {
      unlisten?.();
   };
}

const store = createStore(
   combine(initialStore(), (set, get) => ({
      saveSettings: async () => {
         await saveFile("settings", get().settings);
      },
      saveVoicePreferences: async () => {
         await saveFile("voice-preferences", get().voicePreferences);
      },
      saveKeybinds: async () => {
         await saveFile("keybinds", get().keybinds);
      },
      setSettings: (settings: Partial<AppSettings>) => set((state) => ({ settings: { ...state.settings, ...settings } })),
      setKeybinds: (keybinds: Keybind[]) => set({ keybinds }),
      updateVoicePreferences: (userId: Snowflake, options: { microphoneVolume?: number; streamVolume?: number }) => {
         log("app:files-store", "voice-preferences", "update", "uid:", userId, "mvol:", options.microphoneVolume, "svol:", options.streamVolume);

         set(
            produce((draft: StoreType) => {
               const existingIndex = draft.voicePreferences.findIndex((x) => x.userId === userId);
               if (existingIndex !== -1) {
                  draft.voicePreferences[existingIndex] = { ...draft.voicePreferences[existingIndex], ...options };
               } else {
                  if (!options.microphoneVolume || !options.streamVolume) {
                     throw new Error("Creating new voice preference requires both microphone and screen share volumes");
                  }

                  draft.voicePreferences.push({
                     userId,
                     microphoneVolume: options.microphoneVolume,
                     streamVolume: options.streamVolume,
                  });
               }
            }),
         );

         dispatchEvent("voice_preference_changed", { userId: userId });
      },
   })),
);

export function useFilesStore() {
   return useStore(store);
}

export const filesStore = store;
