import { log, toArrayBuffer } from "@huginn/shared";
import { app, ipcMain } from "electron";
import path from "node:path";
import { fileExists } from "./utils";
import sharp from "sharp";
import { mkdir } from "node:fs/promises";

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
