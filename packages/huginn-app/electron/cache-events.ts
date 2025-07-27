import { log, toArrayBuffer } from "@huginn/shared";
import { app, ipcMain } from "electron";
import path from "node:path";
import { fileExists } from "./utils";
import sharp from "sharp";

export const cacheDir = path.join(app.getPath("userData"), "web-cache");

export function listenToEvents() {
   ipcMain.handle("cache:save-avatar", async (_, data: string, hash: string) => {
      log("app:electron", "recv", "cache save avatar", "h:", hash);

      const filePath = path.join(cacheDir, `${hash}.png`);
      if (await fileExists(filePath)) {
         return;
      }

      const buffer = toArrayBuffer(data);
      await sharp(buffer).resize(256, 256).png().toFile(filePath);
   });
}
