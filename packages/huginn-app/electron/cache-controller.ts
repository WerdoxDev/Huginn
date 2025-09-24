import { log } from "@huginn/shared";
import { app, ipcMain } from "electron";
import path from "node:path";
import { exists } from "./utils";
import { mkdir } from "node:fs/promises";
import { writeFile, readdir } from "node:fs/promises";

export const cacheDir = path.join(app.getPath("userData"), "web-cache");
const cachedKeys = new Set<string>();

export async function listenToEvents() {
   const files = await readdir(cacheDir);
   for (const file of files) {
      const key = file.replace(/\.[^/.]+$/, "");
      cachedKeys.add(key);
   }

   ipcMain.handle("cache:save-image", async (_, url: string, key: string) => {
      log("app:electron", "recv", "cache save image", "url:", url, "key:", key);

      if (cachedKeys.has(key)) {
         return;
      }

      const filePath = path.join(cacheDir, `${key}.png`);

      await mkdir(cacheDir, { recursive: true });
      if (await exists(filePath)) {
         return;
      }

      const buffer = await (await fetch(url)).arrayBuffer();
      await writeFile(filePath, Buffer.from(buffer));

      cachedKeys.add(key);
   });
}
