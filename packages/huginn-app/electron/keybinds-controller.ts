import { globalShortcut, ipcMain, type BrowserWindow } from "electron";

import type { Keybind } from "@/types";

function normalizeCombination(combination: string[]) {
   const normalized = [];
   for (const key of combination) {
      if (key.toLowerCase() === "ctrl") {
         normalized.push("CmdOrCtrl");
      } else if (key.length === 1) {
         normalized.push(key.toUpperCase());
      } else {
         normalized.push(key);
      }
   }

   return normalized;
}

let _isEnabled = true;

export function registerEvents(mainWindow: BrowserWindow) {
   ipcMain.handle("keybinds:update", (_, keybinds: Keybind[]) => {
      globalShortcut.unregisterAll();

      for (const keybind of keybinds) {
         if (keybind.combination.length === 0 || !keybind.isEnabled) {
            continue;
         }

         const accelerator = normalizeCombination(keybind.combination).join("+");
         try {
            globalShortcut.register(accelerator, () => {
               if (!_isEnabled) {
                  return;
               }

               mainWindow.webContents.send("keybinds:fired", keybind.type);
            });
         } catch {
            return false;
         }
      }

      return true;
   });

   ipcMain.on("keybinds:set-enabled", (_, isEnabled: boolean) => {
      _isEnabled = isEnabled;
   });
}
