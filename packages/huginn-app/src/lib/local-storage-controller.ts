import type { StorageMap, FileType, LoadFileResult, SaveFileResult } from "@/types";

import { storageDefaults } from "../../shared/storage-defaults";

export class LocalStorageController {
   private defaultContents: StorageMap;

   constructor() {
      this.defaultContents = { ...storageDefaults };
   }

   public loadItem<K extends FileType>(type: K): LoadFileResult<K> {
      try {
         const existingItem = localStorage.getItem(type);

         if (!existingItem) {
            const defaultData = this.defaultContents[type];
            localStorage.setItem(type, JSON.stringify(defaultData));

            return { created: true, data: defaultData, success: true };
         }

         const data = JSON.parse(existingItem);

         return { created: false, data: data, success: true };
      } catch (e) {
         return {
            created: false,
            data: this.defaultContents[type],
            success: false,
            error: (e as Error).message,
         };
      }
   }

   public saveItem<K extends FileType>(type: K, data: StorageMap[K]): SaveFileResult {
      try {
         localStorage.setItem(type, JSON.stringify(data));
         return { success: true };
      } catch (e) {
         return { success: false, error: (e as Error).message };
      }
   }
}
