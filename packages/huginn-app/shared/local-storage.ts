import { recordSpanError } from "@huginn/shared";

import type { StorageMap, FileType, LoadFileResult, SaveFileResult } from "@/types";

import { StorageAdapter } from "./storage-adapter";

export class LocalStorage extends StorageAdapter {
   public loadFile<K extends FileType>(type: K): LoadFileResult<K> {
      return this.analytics.startActiveSpan("local load file", (span) => {
         span.setAttribute("file.type", type);
         try {
            const existingItem = localStorage.getItem(type);
            span.setAttribute("file.exists", !!existingItem);
            if (!existingItem) {
               const defaultData = this.defaultContents[type];
               localStorage.setItem(type, JSON.stringify(defaultData));

               return { created: true, data: defaultData, success: true };
            }

            const data = JSON.parse(existingItem);

            return { created: false, data: data, success: true };
         } catch (e) {
            recordSpanError(e as Error, this.analytics);
            return {
               created: false,
               data: this.defaultContents[type],
               success: false,
               error: (e as Error).message,
            };
         }
      });
   }

   public saveFile<K extends FileType>(type: K, data: StorageMap[K]): SaveFileResult {
      return this.analytics.startActiveSpan("local save file", (span) => {
         span.setAttribute("file.type", type);
         try {
            localStorage.setItem(type, JSON.stringify(data));
            return { success: true };
         } catch (e) {
            recordSpanError(e as Error, this.analytics);
            return { success: false, error: (e as Error).message };
         }
      });
   }
}
