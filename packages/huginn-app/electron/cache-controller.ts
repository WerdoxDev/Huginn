import { log, toArrayBuffer } from "@huginn/shared";
import { app, ipcMain } from "electron";
import path from "node:path";
import { fileExists } from "./utils";
import sharp from "sharp";
import { mkdir } from "node:fs/promises";
import moment from "moment";
import { Console } from "node:console";

export const cacheDir = path.join(app.getPath("userData"), "web-cache");
const cachedHashes = new Set<string>();

export function listenToEvents() {
   ipcMain.handle("cache:save-hash-image", async (_, data: string, hash: string) => {
      log("app:electron", "recv", "cache save hash image", "h:", hash);

      if (cachedHashes.has(hash)) {
         return;
      }

      const filePath = path.join(cacheDir, `${hash}.png`);

      await mkdir(cacheDir, { recursive: true });
      if (await fileExists(filePath)) {
         return;
      }

      const buffer = toArrayBuffer(data);
      await sharp(buffer).resize(256, 256).png().toFile(filePath);

      cachedHashes.add(hash);
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
