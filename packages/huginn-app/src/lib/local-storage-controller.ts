import type { FileMap, FileType, LoadFileResult, SaveFileResult } from "@/types";
import { fileDefaults } from "../../shared/file-defaults";

export class LocalStorageController {
   private defaultContents: FileMap;

   constructor() {
      this.defaultContents = { ...fileDefaults };
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
         return { created: false, data: this.defaultContents[type], success: false, error: (e as Error).message };
      }
   }

   public saveItem<K extends FileType>(type: K, data: FileMap[K]): SaveFileResult {
      try {
         localStorage.setItem(type, JSON.stringify(data));
         return { success: true };
      } catch (e) {
         return { success: false, error: (e as Error).message };
      }
   }
}
