import { analyticsShim } from "@huginnjs/shared";
import { applyApplicationCatalogUpdate } from "@lib/application-catalog";
import { syncZustandStore } from "@lib/sync-zustand";
import { createStore, useStore } from "zustand";
import { combine, subscribeWithSelector } from "zustand/middleware";

import type { AppSettings, StorageMap, FileType } from "@/types";

import { BridgeStorage } from "../../shared/bridge-storage";
import { LocalStorage } from "../../shared/local-storage";
import { StorageController } from "../../shared/storage-controller";
import { clientStore } from "./clientStoreState";

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

let knownApplicationsSync: Promise<void> | undefined;

export async function updateKnownApplications() {
   if (knownApplicationsSync) return knownApplicationsSync;

   knownApplicationsSync = syncKnownApplications().finally(() => {
      knownApplicationsSync = undefined;
   });

   return knownApplicationsSync;
}

async function syncKnownApplications() {
   const client = clientStore.getState().client;

   if (!client) {
      return;
   }

   const value = await storage.loadFile("known-applications");
   const cached = value.data;
   const hasCurrentSchema = Array.isArray(cached.games) && Array.isArray(cached.matchers) && typeof cached.cursor === "string";
   const result = await client.applications.getKnown(hasCurrentSchema && cached.cursor ? cached.cursor : undefined);

   await store.getState().setValue("known-applications", applyApplicationCatalogUpdate(hasCurrentSchema ? cached : undefined, result));
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

syncZustandStore(store, { name: "storageStore", partialize: (state) => ({ cache: state.cache }) });
