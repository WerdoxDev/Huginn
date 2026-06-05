import type { FileType, StorageMap, LoadFileResult, SaveFileResult } from "@/types";

import { StorageAdapter } from "./storage-adapter";

export class BridgeStorage extends StorageAdapter {
   public async loadFile<K extends FileType>(type: K): Promise<LoadFileResult<K>> {
      return this.analytics.startActiveSpan("bridge load file", async (span) => {
         try {
            span.setAttribute("file.type", type);
            return await window.electronAPI.loadFile(type);
         } finally {
            span.end();
         }
      });
   }
   public async saveFile<K extends FileType>(type: K, data: StorageMap[K]): Promise<SaveFileResult> {
      return this.analytics.startActiveSpan("bridge save file", async (span) => {
         try {
            span.setAttribute("file.type", type);
            return await window.electronAPI.saveFile(type, data);
         } finally {
            span.end();
         }
      });
   }
}
