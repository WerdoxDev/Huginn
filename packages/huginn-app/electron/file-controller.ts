import path from "node:path";
import { app, ipcMain } from "electron";
import type { FileType, StorageMap, LoadFileResult, SaveFileResult } from "@/types";
import fs from "node:fs/promises";
import { storageDefaults } from "../shared/storage-defaults";
import { error, log } from "@huginn/shared";
import { exists } from "./utils";

export class FileController {
   private basePath: string;
   private defaultContents: StorageMap;
   private prefix: string;

   constructor(prefix: string = "") {
      this.basePath = app.getPath("userData");
      this.prefix = prefix;

      this.defaultContents = { ...storageDefaults };
      this.eventListeners();
   }

   private eventListeners() {
      ipcMain.handle("file:load", async (_, type: FileType) => {
         return await this.loadFile(type);
      });

      ipcMain.handle("file:save", async (_, type: FileType, data: StorageMap[FileType]) => {
         return await this.saveFile(type, data);
      });
   }

   private getFilePath(type: FileType) {
      return path.join(this.basePath, this.prefix ? `${this.prefix}_${type}` : type);
   }

   public async loadFile<K extends FileType>(type: K): Promise<LoadFileResult<K>> {
      try {
         const filePath = this.getFilePath(type);
         const exists = await this.fileExists(type);

         log("app:electron", "file-controller", "load file", "typ:", type, "pth:", filePath, "exst:", exists);

         if (!exists) {
            const defaultData = this.defaultContents[type];
            await fs.writeFile(filePath, JSON.stringify(defaultData, null, 2), "utf-8");

            return { created: true, data: defaultData, success: true };
         }

         const content = await fs.readFile(filePath, "utf-8");
         const data = JSON.parse(content);

         return { created: false, data: data, success: true };
      } catch (e) {
         return { created: false, data: this.defaultContents[type], success: false, error: (e as Error).message };
      }
   }

   public async saveFile<K extends FileType>(type: K, data: StorageMap[K]): Promise<SaveFileResult> {
      try {
         const filePath = this.getFilePath(type);

         log("app:electron", "file-controller", "save file", "typ:", type, "pth:", filePath);

         await fs.writeFile(filePath, JSON.stringify(data, null, 2), "utf-8");

         return { success: true };
      } catch (e) {
         return { success: false, error: (e as Error).message };
      }
   }

   public async fileExists(type: FileType) {
      return await exists(this.getFilePath(type));
   }

   public async tryMigrate() {
      try {
         log("app:electron", "file-controller", "trying migration");

         const keys = Object.keys(storageDefaults) as FileType[];

         for (const key of keys) {
            const newPath = this.getFilePath(key);
            const oldPath = path.join(this.basePath, `${key}.json`);
            const oldExists = await exists(oldPath);
            const newExists = await exists(newPath);

            if (!newExists && oldExists) {
               await fs.rename(oldPath, newPath);
            } else if (newExists && oldExists) {
               await fs.rm(oldPath);
            }
         }
      } catch (e) {
         error("app:electron", "file controller migration failed:", e);
      }
   }
}
