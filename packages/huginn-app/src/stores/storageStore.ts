import { createStore, useStore } from "zustand";
import { combine } from "zustand/middleware";
import type { AppSettings, ClientInfo, FileMap, FileType } from "@/types";
import { log, type Snowflake } from "@huginn/shared";
import { produce } from "immer";
import { dispatchEvent } from "@lib/event-handler";
import { clientStore } from "./clientStore";
import { StorageController } from "@lib/storage-controller";

const storage = new StorageController(window.electronAPI ? "electron" : "web");
const initialStore = () => ({
   storage: storage,
   cache: {} as FileMap,
});

type StoreType = ReturnType<typeof initialStore>;

const store = createStore(
   combine(initialStore(), (set, get) => ({
      getValue: async <K extends FileType>(type: K) => {
         const value = await storage.loadFile(type);
         set((state) => ({ cache: { ...state.cache, [type]: value.data } }));
         return value.data as FileMap[K];
      },
      getCachedValue: <K extends FileType>(type: K) => get().cache[type] as FileMap[K],
      setValue: async <K extends FileType>(type: K, data: FileMap[K]) => {
         await storage.saveFile(type, data);
         set((state) => ({ cache: { ...state.cache, [type]: data } }));
      },
      setCachedValue: <K extends FileType>(type: K, data: FileMap[K]) => {
         set((state) => ({ cache: { ...state.cache, [type]: data } }));
      },
      setFromCachedValue: async (type: FileType) => {
         const cache = get().cache[type];
         await storage.saveFile(type, cache);
      },
      updateSettings: (update: Partial<AppSettings>) => {
         const cache = get().cache["settings"];
         set((state) => ({ cache: { ...state.cache, settings: { ...cache, ...update } } }));
      },
      updateVoicePreferences: (userId: Snowflake, options: { microphoneVolume?: number; streamVolume?: number }) => {
         log(
            "app:files-store",
            "voice-preferences",
            "update",
            "uid:",
            userId,
            "mvol:",
            options.microphoneVolume,
            "svol:",
            options.streamVolume,
         );

         set(
            produce((draft: StoreType) => {
               const cache = draft.cache["voice-preferences"];
               const existingIndex = cache.findIndex((x) => x.userId === userId);
               if (existingIndex !== -1) {
                  cache[existingIndex] = { ...cache[existingIndex], ...options };
               } else {
                  if (!options.microphoneVolume || !options.streamVolume) {
                     throw new Error("Creating new voice preference requires both microphone and screen share volumes");
                  }

                  cache.push({
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

export async function initializeStorage() {
   const keys: FileType[] = ["client-info", "custom-applications", "keybinds", "settings", "voice-preferences"];
   const cache = {} as FileMap;

   for (const key of keys) {
      const value = await storage.loadFile(key);

      // Setup client info when needed
      if (key === "client-info" && value.created) {
         const data = value.data as ClientInfo;
         data.id = window.crypto.randomUUID();
         await storage.saveFile("client-info", data);
      }

      if (value.success) {
         (cache[key] as FileMap[FileType]) = value.data;
      }
   }

   store.setState({ cache: cache });
}

export function initializeStorage2() {
   const client = clientStore.getState().client;

   const unlisten = client?.gateway.listen("ready", async () => {
      await updateKnownApplications();
   });

   return () => {
      unlisten?.();
   };
}

export async function updateKnownApplications() {
   const client = clientStore.getState().client;

   if (!client) {
      return;
   }

   const value = await storage.loadFile("known-applications");
   console.log(value);
   if (value.created) {
      const knownApplications = await client.applications.getKnown();
      for (const application of knownApplications.applications) {
         delete application.deletedAt;
      }
      store.getState().setValue("known-applications", knownApplications);
   } else {
      const finalFile = { ...value.data };
      const result = await client?.applications.getKnown(new Date(finalFile.lastUpdated ?? ""));

      for (const application of result.applications) {
         const existingIndex = finalFile.applications.findIndex((x) => x.id === application.id);

         // Remove the application if it's deleted in the new list
         if (application.deletedAt) {
            finalFile.applications = finalFile.applications.filter((x) => x.id !== application.id);
            continue;
         }

         delete application.deletedAt;

         // Update any updated applications
         if (existingIndex !== -1) {
            finalFile.applications[existingIndex] = application;
         }
         // Add any new ones
         else {
            finalFile.applications.push(application);
         }
      }

      finalFile.lastUpdated = result.lastUpdated;

      store.getState().setValue("known-applications", finalFile);
   }
}

export function useStorageStore() {
   return useStore(store);
}

export function useStorage<K extends FileType>(type: K) {
   return useStore(store, (state) => state.cache[type] as FileMap[K]);
}

export const storageStore = store;
