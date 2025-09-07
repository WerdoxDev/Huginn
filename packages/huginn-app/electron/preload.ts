import { contextBridge, ipcRenderer } from "electron";
import type { ProgressInfo, UpdateInfo } from "electron-updater";
import type { AudioSource, DisplaySource, KeybindType } from "@/types";
import type { AppInfo } from "native-addon";

export const electronAPI = {
   getVersion: () => ipcRenderer.invoke("window:version") as Promise<string>,
   showMain: () => ipcRenderer.send("window:show-main"),
   hideMain: () => ipcRenderer.send("window:hide-main"),
   focusMain: () => ipcRenderer.send("window:focus-main"),

   // File management
   loadFile: (name: string) => ipcRenderer.invoke("file:load", name) as Promise<unknown>,
   saveFile: (name: string, content: unknown) => ipcRenderer.invoke("file:save", name, content) as Promise<void>,
   fileExists: (name: string) => ipcRenderer.invoke("file:exists", name) as Promise<boolean>,

   // Display & Audio source
   getDisplaySources: () => ipcRenderer.invoke("window:get-display-sources") as Promise<DisplaySource[]>,
   getAudioSources: () => ipcRenderer.invoke("window:get-audio-sources") as Promise<AudioSource[]>,
   setSelectedDisplaySource: (sourceId: string) => ipcRenderer.send("window:set-selected-display-source", sourceId),

   // Loopback
   startAudioLoopback: (processTitle?: string, processId?: string) =>
      ipcRenderer.invoke("audio:start-loopback", processTitle, processId) as Promise<boolean>,
   stopAudioLoopback: () => ipcRenderer.invoke("audio:stop-loopback") as Promise<void>,
   onLoopbackData: (callback: (_event: Electron.IpcRendererEvent, data: Uint8Array) => void) => {
      ipcRenderer.on("audio:loopback-data", callback);
      return () => {
         ipcRenderer.off("audio:loopback-data", callback);
      };
   },

   // Cache
   saveHashImageToCache: (data: string, hash: string) => ipcRenderer.invoke("cache:save-hash-image", data, hash) as Promise<void>,

   // Keybinds
   updateKeybinds: (keybinds: Array<{ type: KeybindType; combination: string[] }>) =>
      ipcRenderer.invoke("keybinds:update", keybinds) as Promise<boolean>,
   setKeybindsEnabled: (isEnabled: boolean) => ipcRenderer.send("keybinds:set-enabled", isEnabled),
   onKeybindFired: (callback: (_event: Electron.IpcRendererEvent, type: KeybindType) => void) => {
      ipcRenderer.on("keybinds:fired", callback);
      return () => ipcRenderer.off("keybinds:fired", callback);
   },

   // Update
   checkUpdate: () => ipcRenderer.invoke("update:check") as Promise<UpdateInfo | undefined>,
   downloadUpdate: () => ipcRenderer.send("update:download"),
   setUpdateUrl: (url: string) => ipcRenderer.send("update:set-url", url),
   onUpdateProgress: (callback: (_event: Electron.IpcRendererEvent, info: ProgressInfo) => void) => {
      ipcRenderer.on("update:progress", callback);
      return () => ipcRenderer.off("update:progress", callback);
   },

   openExternal: (url: string) => ipcRenderer.send("shell:open-external", url),
   getArgs: () => ipcRenderer.invoke("cli:get-args") as Promise<string[]>,
   onDeepLink: (callback: (_event: Electron.IpcRendererEvent, cmd: string) => void) => {
      ipcRenderer.on("cli:deep-link", callback);
      return () => ipcRenderer.off("cli:deep-link", callback);
   },

   sendNotification: (title: string, body: string, payload?: string, icon?: string) =>
      ipcRenderer.send("notification:send", { title, body, payload, icon }),
   onNotificationClicked: (callback: (_event: Electron.IpcRendererEvent, payload: string) => void) => {
      ipcRenderer.on("notification:clicked", callback);
      return () => ipcRenderer.off("notification:clicked", callback);
   },

   minimize: () => ipcRenderer.send("window:minimize"),
   setFullscreen: (fullscreen: boolean) => ipcRenderer.send("window:set-fullscreen", fullscreen),
   toggleMaximize: () => ipcRenderer.send("window:toggle-maximize"),
   onMaximizedChanged: (callback: (_event: Electron.IpcRendererEvent, isMaximized: boolean) => void) => {
      ipcRenderer.on("window:is-maximized", callback);
      return () => ipcRenderer.off("window:is-maximized", callback);
   },
   onFullscreenChanged: (callback: (_event: Electron.IpcRendererEvent, isFullscreen: boolean) => void) => {
      ipcRenderer.on("window:is-fullscreen", callback);
      return () => ipcRenderer.off("window:is-fullscreen", callback);
   },

   // Native
   getOpenApplications: () => ipcRenderer.invoke("native:get-open-applications") as Promise<AppInfo[]>,
   getExeLargeIcon: (exePath: string) => ipcRenderer.invoke("native:get-exe-large-icon", exePath) as Promise<string>,
};

contextBridge.exposeInMainWorld("electronAPI", electronAPI);
