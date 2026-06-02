import type { StorageMap, FileType, LoadFileResult, SaveFileResult } from "@/types";

import type { StorageAdapter } from "./storage-adapter";

import { storageDefaults } from "./storage-defaults";

export class StorageController<A extends StorageAdapter> {
   public adapter: A;

   constructor(adapter: A) {
      this.adapter = adapter;
   }

   public async setupClientInfo() {
      const value = await this.loadFile("client-info");
      if (value.created || !value.data.id) {
         const data = value.data;

         if (typeof window !== "undefined" && window.isSecureContext) data.id = window.crypto.randomUUID();
         else {
            const crypto = await import("node:crypto");
            data.id = crypto.randomUUID();
         }

         await this.saveFile("client-info", data);
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

         if (type === "settings") {
            const parsedFile = file.data as StorageMap["settings"];

            //@ts-ignore - handle old theme naming
            if (parsedFile.theme === "pine green") {
               await this.saveFile(type, { ...parsedFile, theme: "pine-green" });
            }

            if (!parsedFile.hostnamePresets || parsedFile.hostnamePresets.length === 0) {
               await this.saveFile(type, {
                  ...parsedFile,
                  hostnamePresets: storageDefaults.settings.hostnamePresets,
                  activePresetName: "Default",
               });
            } else if (!parsedFile.activePresetName || parsedFile.activePresetName === "") {
               await this.saveFile(type, {
                  ...parsedFile,
                  activePresetName: parsedFile.hostnamePresets[0]?.name ?? "Default",
               });
            }
         }
      }
   }

   public async loadFile<K extends FileType>(type: K): Promise<LoadFileResult<K>> {
      return await this.adapter!.loadFile(type);
   }

   public async saveFile<K extends FileType>(type: K, data: StorageMap[K]): Promise<SaveFileResult> {
      return await this.adapter!.saveFile(type, data);
   }
}
