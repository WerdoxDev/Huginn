import type { FileType, LoadFileResult, StorageMap, SaveFileResult } from "@/types";

import { storageDefaults } from "./storage-defaults";

export abstract class StorageAdapter {
   public defaultContents: StorageMap;

   public constructor() {
      this.defaultContents = { ...storageDefaults };
   }
   public abstract loadFile<K extends FileType>(type: K): Promise<LoadFileResult<K>> | LoadFileResult<K>;
   public abstract saveFile<K extends FileType>(type: K, data: StorageMap[K]): Promise<SaveFileResult> | SaveFileResult;
}
