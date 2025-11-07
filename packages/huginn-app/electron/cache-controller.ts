import { log } from "@huginn/shared";
import { app, ipcMain } from "electron";
import path from "node:path";
import { exists } from "./utils";
import { mkdir } from "node:fs/promises";
import { writeFile, readdir } from "node:fs/promises";

export class CacheController {
   public cacheDir = path.join(app.getPath("userData"), "web-cache");
   private cachedKeys: Set<string>;

   public constructor() {
      this.cachedKeys = new Set();
      this.eventListeners();
   }

   private async eventListeners() {
      const files = await readdir(this.cacheDir);
      for (const file of files) {
         const key = file.replace(/\.[^/.]+$/, "");
         this.cachedKeys.add(key);
      }

      ipcMain.handle("cache:save-image", async (_, url: string, key: string) => {
         log("app:electron", "recv", "cache save image", "url:", url, "key:", key);

         if (this.cachedKeys.has(key)) {
            return;
         }

         const filePath = path.join(this.cacheDir, `${key}.png`);

         await mkdir(this.cacheDir, { recursive: true });
         if (await exists(filePath)) {
            return;
         }

         const buffer = await (await fetch(url)).arrayBuffer();
         await writeFile(filePath, Buffer.from(buffer));

         this.cachedKeys.add(key);
      });
   }
}
