import type { DisplaySource } from "@/types";
import type { AppSettings } from "@stores/settingsStore";
import { contextBridge, ipcRenderer } from "electron";
import type { ProgressInfo, UpdateInfo } from "electron-updater";

export const electronAPI = {
   getVersion: () => ipcRenderer.invoke("window:version") as Promise<string>,
   splashscreenMode: () => ipcRenderer.send("window:splashscreen-mode"),
   mainMode: () => ipcRenderer.send("window:main-mode"),
   showMain: () => ipcRenderer.send("window:show-main"),
   hideMain: () => ipcRenderer.send("window:hide-main"),
   focusMain: () => ipcRenderer.send("window:focus-main"),
   minimize: () => ipcRenderer.send("window:minimize"),
   setFullscreen: (fullscreen: boolean) => ipcRenderer.send("window:set-fullscreen", fullscreen),
   toggleMaximize: () => ipcRenderer.send("window:toggle-maximize"),
   checkUpdate: () => ipcRenderer.invoke("update:check") as Promise<UpdateInfo | undefined>,
   downloadUpdate: () => ipcRenderer.send("update:download"),
   getArgs: () => ipcRenderer.invoke("cli:get-args") as Promise<string[]>,
   openExteral: (url: string) => ipcRenderer.send("shell:open-external", url),
   sendNotification: (title: string, body: string, payload?: string) => ipcRenderer.send("notification:send", { title, body, payload }),
   loadSettings: () => ipcRenderer.invoke("settings:load") as Promise<AppSettings>,
   saveSettings: (settings: string) => ipcRenderer.invoke("settings:save", settings) as Promise<void>,
   trySaveDefaultSettings: (settings: string) => ipcRenderer.invoke("settings:try-save-default", settings) as Promise<void>,
   getDisplaySources: () => ipcRenderer.invoke("window:get-display-sources") as Promise<DisplaySource[]>,
   setSelectedDisplaySource: (sourceId: string) => ipcRenderer.send("window:set-selected-display-source", sourceId),
   startAudioLoopback: (processTitle: string) => ipcRenderer.send("audio:start-loopback", processTitle),
   stopAudioLoopback: () => ipcRenderer.send("audio:stop-loopback"),
   onUpdateProgress: (callback: (_event: Electron.IpcRendererEvent, info: ProgressInfo) => void) => {
      ipcRenderer.on("update:progress", callback);
      return () => ipcRenderer.off("update:progress", callback);
   },
   onDeepLink: (callback: (_event: Electron.IpcRendererEvent, cmd: string) => void) => {
      ipcRenderer.on("cli:deep-link", callback);
      return () => ipcRenderer.off("cli:deep-link", callback);
   },
   onNotificationClick: (callback: (_event: Electron.IpcRendererEvent, payload: string) => void) => {
      ipcRenderer.on("notification:clicked", callback);
      return () => ipcRenderer.off("notification:clicked", callback);
   },
   onMaximizedChanged: (callback: (_event: Electron.IpcRendererEvent, isMaximized: boolean) => void) => {
      ipcRenderer.on("window:is-maximized", callback);
      return () => ipcRenderer.off("window:is-maximized", callback);
   },
   onFullscreenChanged: (callback: (_event: Electron.IpcRendererEvent, isFullscreen: boolean) => void) => {
      ipcRenderer.on("window:is-fullscreen", callback);
      return () => ipcRenderer.off("window:is-fullscreen", callback);
   },
   onLoopbackData: (callback: (_event: Electron.IpcRendererEvent, data: Uint8Array) => void) => {
      ipcRenderer.on("audio:loopback-data", callback);
      return () => {
         ipcRenderer.off("audio:loopback-data", callback);
      }
   }
};

contextBridge.exposeInMainWorld("electronAPI", electronAPI);
