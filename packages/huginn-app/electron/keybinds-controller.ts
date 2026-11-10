import { app, globalShortcut, ipcMain, type BrowserWindow } from "electron";

import type { Keybind } from "@/types";

import { HyprlandKeybinds } from "./hyprland-keybinds";

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
   const fired = (type: Keybind["type"]) => {
      if (_isEnabled && !mainWindow.webContents.isDestroyed()) mainWindow.webContents.send("keybinds:fired", type);
   };
   const hyprland =
      process.platform === "linux" && process.env.HYPRLAND_INSTANCE_SIGNATURE
         ? new HyprlandKeybinds(fired, (error) => console.error("Huginn shortcut error:", error))
         : undefined;
   let registered: Keybind[] = [];

   const register = (keybinds: Keybind[]) => {
      globalShortcut.unregisterAll();
      for (const keybind of keybinds) {
         if (keybind.combination.length === 0 || !keybind.isEnabled) {
            continue;
         }

         const accelerator = normalizeCombination(keybind.combination).join("+");
         if (!globalShortcut.register(accelerator, () => fired(keybind.type))) throw new Error(`Could not register shortcut ${accelerator}`);
      }
   };

   ipcMain.handle("keybinds:update", async (_, keybinds: Keybind[]) => {
      try {
         if (hyprland) await hyprland.update(keybinds);
         else register(keybinds);
         registered = keybinds;
         return true;
      } catch (error) {
         console.error("Could not update Huginn shortcuts:", error);
         if (!hyprland) {
            try {
               register(registered);
            } catch (restoreError) {
               console.error("Could not restore Huginn shortcuts:", restoreError);
            }
         }
         return false;
      }
   });

   ipcMain.on("keybinds:set-enabled", (_, isEnabled: boolean) => {
      _isEnabled = isEnabled;
      void hyprland?.setEnabled(isEnabled).catch(console.error);
   });

   const stop = () => {
      globalShortcut.unregisterAll();
      return hyprland?.stop() ?? Promise.resolve();
   };
   mainWindow.once("closed", () => {
      void stop().catch(console.error);
   });
   let quitting = false;
   app.on("before-quit", (event) => {
      if (quitting) return;
      quitting = true;
      event.preventDefault();
      void stop()
         .catch(console.error)
         .finally(() => app.quit());
   });
}
