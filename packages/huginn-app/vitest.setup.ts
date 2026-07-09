import { beforeEach } from "vitest";

import { initializeClient, setHostnamesFromSettings } from "./src/stores/clientStore";
import { initStorageStoreEarly } from "./src/stores/storageStore";
// global.localStorage = window.localStorage;

beforeEach(async () => {
   window.localStorage = {
      store: {},
      getItem(key) {
         return this.store[key] ?? null;
      },
      setItem(key, value) {
         this.store[key] = String(value);
      },
      removeItem(key) {
         delete this.store[key];
      },
      clear() {
         this.store = {};
      },
   } as unknown as typeof window.localStorage;
   localStorage.clear();
   await initStorageStoreEarly();
   setHostnamesFromSettings();
   // await initializeClient();
});
