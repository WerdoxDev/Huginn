import type { StorageMap, FileType, LoadFileResult, SaveFileResult } from "@/types";

import { storageDefaults } from "../../shared/storage-defaults";
import { LocalStorageController } from "./local-storage-controller";

export class StorageController {
   private storageType: "electron" | "web";
   private localStorageController?: LocalStorageController;

   constructor(storageType: "electron" | "web") {
      this.storageType = storageType;

      if (storageType === "web") {
         this.localStorageController = new LocalStorageController();
      }
   }

   public async checkFiles() {
      for (const [type, defaultContent] of Object.entries(storageDefaults)) {
         if (Array.isArray(defaultContent)) continue;

         const file = (await this.loadFile(type as FileType)) || {};
         const merged = { ...defaultContent, ...file.data };

         // Only save if there were missing keys
         if (Object.keys(merged).length !== Object.keys(file).length) {
            await this.saveFile(type as FileType, merged);
         }
      }
   }

   public async loadFile<K extends FileType>(type: K): Promise<LoadFileResult<K>> {
      if (this.storageType === "electron") {
         return await window.electronAPI.loadFile(type);
      } else {
         return this.localStorageController!.loadItem(type);
      }
   }

   public async saveFile<K extends FileType>(type: K, data: StorageMap[K]): Promise<SaveFileResult> {
      if (this.storageType === "electron") {
         return await window.electronAPI.saveFile(type, data);
      } else {
         return this.localStorageController!.saveItem(type, data);
      }
   }
}
