import type { FileType, StorageMap, LoadFileResult, SaveFileResult } from "@/types";

import { StorageAdapter } from "./storage-adapter";

export class BridgeStorage extends StorageAdapter {
   public loadFile<K extends FileType>(type: K): Promise<LoadFileResult<K>> | LoadFileResult<K> {
      return window.electronAPI.loadFile(type);
   }
   public saveFile<K extends FileType>(type: K, data: StorageMap[K]): Promise<SaveFileResult> | SaveFileResult {
      return window.electronAPI.saveFile(type, data);
   }
}
