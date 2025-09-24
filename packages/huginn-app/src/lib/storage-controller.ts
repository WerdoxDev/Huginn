import type { FileMap, FileType, LoadFileResult, SaveFileResult } from "@/types";
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

   public async loadFile<K extends FileType>(type: K): Promise<LoadFileResult<K>> {
      if (this.storageType === "electron") {
         return await window.electronAPI.loadFile(type);
      } else {
         return this.localStorageController!.loadItem(type);
      }
   }

   public async saveFile<K extends FileType>(type: K, data: FileMap[K]): Promise<SaveFileResult> {
      if (this.storageType === "electron") {
         return await window.electronAPI.saveFile(type, data);
      } else {
         return this.localStorageController!.saveItem(type, data);
      }
   }
}
