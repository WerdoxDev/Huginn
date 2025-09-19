import { log } from "@huginn/shared";
import { app, ipcMain } from "electron";
import path from "node:path";
import { fileExists } from "./utils";
import { mkdir } from "node:fs/promises";
import moment from "moment";
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
      if (await fileExists(filePath)) {
         return;
      }

      const buffer = await (await fetch(url)).arrayBuffer();
      await writeFile(filePath, Buffer.from(buffer));

      cachedKeys.add(key);
   });
}

export class CacheStorage<K, V> {
   private _storage = new Map<K, { cachedTime: number; value: V }>();
   private _cacheTime: number;

   public constructor(cacheTime: number) {
      this._cacheTime = cacheTime;
   }

   public async cacheOrGet(key: K, getter: (() => V) | (() => Promise<V>)): Promise<V> {
      const now = new Date();
      const existing = this._storage.get(key);

      if (existing && moment(now).diff(existing.cachedTime, "seconds") <= this._cacheTime) {
         return existing.value;
      } else {
         const item = await getter();
         this._storage.set(key, { cachedTime: now.getTime(), value: item });
         return item;
      }
   }
}
