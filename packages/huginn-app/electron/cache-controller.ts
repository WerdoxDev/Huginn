import { log } from "@huginn/shared";
import { app, ipcMain } from "electron";
import { mkdir } from "node:fs/promises";
import { readdir } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

import { exists } from "./utils";

const defaultCacheEntries = [
   { key: "cerulean", color: "#007ba7" },
   { key: "pine-green", color: "#008c7d" },
   { key: "eggplant", color: "#7C515D" },
   { key: "coffee", color: "#7b563c" },
   { key: "charcoal", color: "#3d5361" },
   { key: "scarlet", color: "#c71b07" },
] as const;

export class CacheController {
   public cacheDir = path.join(app.getPath("userData"), "web-cache");
   private cachedKeys: Set<string>;

   public constructor() {
      this.cachedKeys = new Set();
      this.eventListeners();
   }

   private async eventListeners() {
      await this.ensureCacheDir();

      const files = await readdir(this.cacheDir);
      for (const file of files) {
         const key = file.replace(/\.[^/.]+$/, "");
         this.cachedKeys.add(key);
      }

      await this.seedDefaultCacheImages();

      ipcMain.handle("cache:save-image", async (_, url: string, key: string) => {
         log("app:electron", "recv", "cache save image", "url:", url, "key:", key);

         if (this.cachedKeys.has(key)) return;

         const filePath = this.getCacheFilePath(key);

         if (await exists(filePath)) {
            return;
         }

         const buffer = await (await fetch(url)).arrayBuffer();
         await this.writeRoundedPng(filePath, Buffer.from(buffer));

         this.cachedKeys.add(key);
      });
   }

   private async seedDefaultCacheImages() {
      for (const entry of defaultCacheEntries) {
         const { key, color } = entry;
         if (this.cachedKeys.has(key)) continue;

         const filePath = this.getCacheFilePath(key);

         if (await exists(filePath)) {
            this.cachedKeys.add(key);
            continue;
         }

         await this.writeRoundedPng(filePath, await this.createSolidColorBuffer(color));

         this.cachedKeys.add(key);
      }
   }

   private async ensureCacheDir() {
      if (!(await exists(this.cacheDir))) {
         await mkdir(this.cacheDir, { recursive: true });
      }
   }

   private getCacheFilePath(key: string) {
      return path.join(this.cacheDir, `${key}.png`);
   }

   private async createSolidColorBuffer(color: string) {
      return await sharp({ create: { width: 128, height: 128, channels: 4, background: color } })
         .png()
         .toBuffer();
   }

   private async writeRoundedPng(filePath: string, input: Buffer) {
      await sharp(input)
         .resize(128, 128, { fit: "cover" })
         .composite([{ input: this.roundMask(), blend: "dest-in" }])
         .png()
         .toFile(filePath);
   }

   private roundMask() {
      return Buffer.from(
         `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128"><rect width="128" height="128" rx="64" ry="64" fill="#fff"/></svg>`,
      );
   }
}
