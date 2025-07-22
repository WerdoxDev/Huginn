import { access, constants, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { error, log } from "@huginn/shared";
import { app, type BrowserWindow, ipcMain } from "electron";

function getPath(name: string) {
   return path.join(app.getPath("userData"), `${name}.json`);
}

export function listenToEvents(_mainWindow: BrowserWindow) {
   ipcMain.handle("file:load", async (_, name: string) => {
      log("app:electron", "recv", "file load", "n:", name);

      try {
         const fileContent = await readFile(getPath(name), { encoding: "utf-8" });
         return JSON.parse(fileContent);
      } catch (e) {
         error("app:electron", "Error reading file: ", e)
         return {};
      }
   });

   ipcMain.handle("file:save", async (_, name: string, content: unknown) => {
      log("app:electron", "recv", "file save", "n:", name);

      try {
         await writeFile(getPath(name), JSON.stringify(content, null, 2));
      } catch (e) {
         error("app:electron", "Error writing file: ", e)
      }
   });

   ipcMain.handle("file:exists", async (_, name: string) => {
      log("app:electron", "recv", "file exists", "n:", name);

      try {
         await access(getPath(name), constants.R_OK | constants.W_OK);
         return true;
      } catch (_e) {
         return false
      }
   })
}
