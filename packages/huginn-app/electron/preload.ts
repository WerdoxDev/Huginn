import { contextBridge, ipcRenderer } from "electron";
import type { ProgressInfo, UpdateInfo } from "electron-updater";
import type { AudioSource, DisplaySource } from "@/types";

export const electronAPI = {
   getVersion: () => ipcRenderer.invoke("window:version") as Promise<string>,
   showMain: () => ipcRenderer.send("window:show-main"),
   hideMain: () => ipcRenderer.send("window:hide-main"),
   focusMain: () => ipcRenderer.send("window:focus-main"),
   minimize: () => ipcRenderer.send("window:minimize"),
   setFullscreen: (fullscreen: boolean) => ipcRenderer.send("window:set-fullscreen", fullscreen),
   toggleMaximize: () => ipcRenderer.send("window:toggle-maximize"),
   checkUpdate: () => ipcRenderer.invoke("update:check") as Promise<UpdateInfo | undefined>,
   downloadUpdate: () => ipcRenderer.send("update:download"),
   setUpdateUrl: (url: string) => ipcRenderer.send("update:set-url", url),
   getArgs: () => ipcRenderer.invoke("cli:get-args") as Promise<string[]>,
   openExternal: (url: string) => ipcRenderer.send("shell:open-external", url),
   sendNotification: (title: string, body: string, payload?: string, icon?: string) =>
      ipcRenderer.send("notification:send", { title, body, payload, icon }),
   loadFile: (name: string) => ipcRenderer.invoke("file:load", name) as Promise<unknown>,
   saveFile: (name: string, content: unknown) => ipcRenderer.invoke("file:save", name, content) as Promise<void>,
   fileExists: (name: string) => ipcRenderer.invoke("file:exists", name) as Promise<boolean>,
   getDisplaySources: () => ipcRenderer.invoke("window:get-display-sources") as Promise<DisplaySource[]>,
   getAudioSources: () => ipcRenderer.invoke("window:get-audio-sources") as Promise<AudioSource[]>,
   setSelectedDisplaySource: (sourceId: string) => ipcRenderer.send("window:set-selected-display-source", sourceId),
   startAudioLoopback: (processTitle?: string, processId?: string) => ipcRenderer.send("audio:start-loopback", processTitle, processId),
   stopAudioLoopback: () => ipcRenderer.invoke("audio:stop-loopback") as Promise<void>,

   saveAvatarToCache: (data: string, hash: string) => ipcRenderer.invoke("cache:save-avatar", data, hash) as Promise<void>,

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
      };
   },
};

contextBridge.exposeInMainWorld("electronAPI", electronAPI);
