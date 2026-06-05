import type { Analytics } from "@huginn/shared";

import type { FileType, LoadFileResult, StorageMap, SaveFileResult } from "@/types";

import { storageDefaults } from "./storage-defaults";

export abstract class StorageAdapter {
   public defaultContents: StorageMap;
   public analytics: Analytics;

   public constructor(analytics: Analytics) {
      this.defaultContents = { ...storageDefaults };
      this.analytics = analytics;
   }
   public setAnalytics(analytics: Analytics) {
      this.analytics = analytics;
   }
   public abstract loadFile<K extends FileType>(type: K): Promise<LoadFileResult<K>> | LoadFileResult<K>;
   public abstract saveFile<K extends FileType>(type: K, data: StorageMap[K]): Promise<SaveFileResult> | SaveFileResult;
}
