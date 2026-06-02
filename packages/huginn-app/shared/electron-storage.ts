import { SpanStatusCode, type Analytics } from "@huginn/shared";
import { app, ipcMain } from "electron";
import fs from "node:fs/promises";
import path from "node:path";

import type { FileType, StorageMap, LoadFileResult, SaveFileResult } from "@/types";

import { exists } from "../electron/utils";
import { StorageAdapter } from "./storage-adapter";
import { storageDefaults } from "./storage-defaults";

export class ElectronStorage extends StorageAdapter {
   private basePath: string;
   private prefix: string;

   constructor(prefix: string = "", analytics: Analytics) {
      super(analytics);
      this.basePath = app.getPath("userData");
      this.prefix = prefix;

      this.eventListeners();
   }

   private eventListeners() {
      ipcMain.handle("file:load", async (_, type: FileType) => {
         return this.analytics.startActiveSpan("ipc load file", async (span) => {
            try {
               span.setAttribute("file.type", type);
               return await this.loadFile(type);
            } finally {
               span.end();
            }
         });
      });

      ipcMain.handle("file:save", async (_, type: FileType, data: StorageMap[FileType]) => {
         return this.analytics.startActiveSpan("ipc save file", async (span) => {
            try {
               span.setAttribute("file.type", type);
               return await this.saveFile(type, data);
            } finally {
               span.end();
            }
         });
      });
   }

   public getFilePath(type: FileType) {
      return path.join(this.basePath, this.prefix ? `${this.prefix}_${type}` : type);
   }

   public async loadFile<K extends FileType>(type: K): Promise<LoadFileResult<K>> {
      return this.analytics.startActiveSpan("load file", async (span) => {
         span.setAttribute("file.type", type);
         try {
            const filePath = this.getFilePath(type);
            const exists = await this.fileExists(type);

            span.setAttributes({ "file.exists": exists, "file.path": filePath });

            if (!exists) {
               const defaultData = this.defaultContents[type];
               await fs.writeFile(filePath, JSON.stringify(defaultData, null, 2), "utf-8");

               span.setAttribute("file.created", true);
               return { created: true, data: defaultData, success: true };
            }

            const content = await fs.readFile(filePath, "utf-8");
            const data = JSON.parse(content);

            span.setAttribute("file.created", false);
            return { created: false, data: data, success: true };
         } catch (e) {
            span.recordException(e as Error);
            span.setStatus({ code: SpanStatusCode.ERROR, message: (e as Error).message });
            return {
               created: false,
               data: this.defaultContents[type],
               success: false,
               error: (e as Error).message,
            };
         } finally {
            span.end();
         }
      });
   }

   public async saveFile<K extends FileType>(type: K, data: StorageMap[K]): Promise<SaveFileResult> {
      return this.analytics.startActiveSpan("save file", async (span) => {
         span.setAttribute("file.type", type);
         try {
            const filePath = this.getFilePath(type);

            await fs.writeFile(filePath, JSON.stringify(data, null, 2), "utf-8");

            return { success: true };
         } catch (e) {
            span.recordException(e as Error);
            span.setStatus({ code: SpanStatusCode.ERROR, message: (e as Error).message });
            return { success: false, error: (e as Error).message };
         } finally {
            span.end();
         }
      });
   }

   public async fileExists(type: FileType) {
      return await exists(this.getFilePath(type));
   }

   public async tryMigrate() {
      this.analytics.startActiveSpan("electron storage migration", async (span) => {
         try {
            const keys = Object.keys(storageDefaults) as FileType[];

            for (const key of keys) {
               const newPath = this.getFilePath(key);
               const oldPath = path.join(this.basePath, `${key}.json`);
               const oldExists = await exists(oldPath);
               const newExists = await exists(newPath);

               span.addEvent("migration check", { key, oldExists, newExists });

               if (!newExists && oldExists) {
                  await fs.rename(oldPath, newPath);
               } else if (newExists && oldExists) {
                  await fs.rm(oldPath);
               }
            }
         } catch (e) {
            span.recordException(e as Error);
            span.setStatus({ code: SpanStatusCode.ERROR, message: (e as Error).message });
         } finally {
            span.end();
         }
      });
   }
}
