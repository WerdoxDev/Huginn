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

         if (typeof window !== "undefined") {
            if (window.isSecureContext) data.id = window.crypto.randomUUID();
            else data.id = "insecure-" + Math.random().toString(16).slice(2);
         } else {
            const crypto = await import("node:crypto");
            data.id = crypto.randomUUID();
         }

         await this.saveFile("client-info", data);
      }
   }

   public async mergeNewProperties() {
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
      return await this.adapter!.loadFile(type);
   }

   public async saveFile<K extends FileType>(type: K, data: StorageMap[K]): Promise<SaveFileResult> {
      return await this.adapter!.saveFile(type, data);
   }
}
