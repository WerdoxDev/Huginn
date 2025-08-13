import type { Keybind, KeybindType } from "@/types";
import { log } from "@huginn/shared";
import { globalShortcut, ipcMain, type BrowserWindow } from "electron";

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

export function listenToEvents(mainWindow: BrowserWindow) {
   ipcMain.on("keybinds:update", (_, keybinds: Keybind[]) => {
      log("app:electron", "recv", "keybinds update");

      globalShortcut.unregisterAll();

      for (const keybind of keybinds) {
         if (keybind.combination.length === 0 || !keybind.isEnabled) {
            continue;
         }

         const accelerator = normalizeCombination(keybind.combination).join("+");
         console.log(accelerator);
         globalShortcut.register(accelerator, () => {
            if (!_isEnabled) {
               return;
            }

            log("app:electron", "send", "keybind fire", "type:", keybind.type);
            mainWindow.webContents.send("keybinds:fired", keybind.type);
         });
      }
   });

   ipcMain.on("keybinds:set-enabled", (_, isEnabled: boolean) => {
      _isEnabled = isEnabled;
   });
}
