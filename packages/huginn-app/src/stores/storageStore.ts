import { analyticsShim } from "@huginnjs/shared";
import { createStore, useStore } from "zustand";
import { combine, subscribeWithSelector } from "zustand/middleware";

import type { AppSettings, StorageMap, FileType } from "@/types";

import { BridgeStorage } from "../../shared/bridge-storage";
import { LocalStorage } from "../../shared/local-storage";
import { StorageController } from "../../shared/storage-controller";
import { clientStore } from "./clientStore";

const storage = new StorageController(window.electronAPI ? new BridgeStorage(analyticsShim) : new LocalStorage(analyticsShim));
const initialStore = () => ({
   storage: storage,
   cache: {} as StorageMap,
});

const store = createStore(
   subscribeWithSelector(
      combine(initialStore(), (set, get) => ({
         getValue: async <K extends FileType>(type: K) => {
            const value = await storage.loadFile(type);
            set((state) => ({ cache: { ...state.cache, [type]: value.data } }));
            return value.data as StorageMap[K];
         },
         getCachedValue: <K extends FileType>(type: K) => get().cache[type] as StorageMap[K],
         setValue: async <K extends FileType>(type: K, data: StorageMap[K]) => {
            await storage.saveFile(type, data);
            set((state) => ({ cache: { ...state.cache, [type]: data } }));
         },
         setCachedValue: <K extends FileType>(type: K, data: StorageMap[K]) => {
            set((state) => ({ cache: { ...state.cache, [type]: data } }));
         },
         saveFromCachedValue: async (type: FileType) => {
            const cache = get().cache[type];
            await storage.saveFile(type, cache);
         },
         updateSettings: async (update: Partial<AppSettings>) => {
            const settings = { ...get().cache.settings, ...update };
            set((state) => ({ cache: { ...state.cache, settings } }));
            await storage.saveFile("settings", settings);
         },
      })),
   ),
);

export async function initStorageStoreEarly() {
   const keys: FileType[] = ["client-info", "custom-applications", "keybinds", "settings", "pinned-channels"];
   const cache = {} as StorageMap;

   await storage.mergeNewProperties();
   await storage.setupClientInfo();

   for (const key of keys) {
      const value = await storage.loadFile(key);

      if (value.success) {
         (cache[key] as StorageMap[FileType]) = value.data;
      }
   }

   store.setState({ cache: cache });

   registerChangeHandlers();
}

export function initStorageStoreClient() {
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
   if (value.created) {
      const knownApplications = await client.applications.getKnown();
      for (const application of knownApplications.applications) {
         delete application.deletedAt;
      }
      store.getState().setValue("known-applications", knownApplications);
   } else {
      const finalFile = { ...value.data };
      const result = await client?.applications.getKnown(finalFile.lastUpdated ? new Date(finalFile.lastUpdated) : undefined);

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

function registerChangeHandlers() {
   store.subscribe(
      (state) => state.cache,
      async (state, prevState) => {
         if (!window.electronAPI) return;
         if (state.settings.useProxy !== prevState.settings?.useProxy) {
            await window.electronAPI.setProxy(state.settings.useProxy);
         }
      },
   );
}

export function useStorageStore() {
   return useStore(store);
}

export function useStorage<K extends FileType>(type: K) {
   return useStore(store, (state) => state.getCachedValue(type));
}

export type StorageStoreType = ReturnType<typeof useStorageStore>;
export const storageStore = store;
