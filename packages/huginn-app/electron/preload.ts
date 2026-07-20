import type { LogArgs } from "@huginn/shared";
import type { ProgressInfo, UpdateInfo } from "electron-updater";
import type { ProcessInfo } from "native-addon";

import { contextBridge, ipcRenderer } from "electron";

import type { AudioSource, DisplaySource, StorageMap, FileType, KeybindType, LoadFileResult, SaveFileResult, ApplicationInfo, OsInfo } from "@/types";

export const electronAPI = {
   // Window
   getVersion: () => ipcRenderer.invoke("window:version") as Promise<string>,
   showMain: () => ipcRenderer.send("window:show-main"),
   hideMain: () => ipcRenderer.send("window:hide-main"),
   focusMain: () => ipcRenderer.send("window:focus-main"),
   relaunch: () => ipcRenderer.send("window:relaunch"),
   processId: () => ipcRenderer.invoke("window:process-id") as Promise<number>,

   // File management
   loadFile: <K extends FileType>(type: K) => ipcRenderer.invoke("file:load", type) as Promise<LoadFileResult<K>>,
   saveFile: <K extends FileType>(type: K, data: StorageMap[K]) => ipcRenderer.invoke("file:save", type, data) as Promise<SaveFileResult>,
   // fileExists: (name: string) => ipcRenderer.invoke("file:exists", name) as Promise<boolean>,

   // Logger
   addToLogBuffer: (type: "log" | "error", section: string, level: string | undefined, ...args: LogArgs[]) =>
      ipcRenderer.send("logger:add-to-buffer", type, section, level, ...args),

   // Display & Audio source
   getDisplaySources: () => ipcRenderer.invoke("window:get-display-sources") as Promise<DisplaySource[]>,
   getAudioSources: () => ipcRenderer.invoke("window:get-audio-sources") as Promise<AudioSource[]>,
   setSelectedDisplaySource: (source: DisplaySource) => ipcRenderer.send("window:set-selected-display-source", source),

   // Loopback
   startAudioLoopback: (processTitle?: string, processId?: number) =>
      ipcRenderer.invoke("audio:start-loopback", processTitle, processId) as Promise<boolean>,
   stopAudioLoopback: () => ipcRenderer.invoke("audio:stop-loopback") as Promise<void>,
   onLoopbackData: (callback: (_event: Electron.IpcRendererEvent, data: Uint8Array) => void) => {
      ipcRenderer.on("audio:loopback-data", callback);
      return () => {
         ipcRenderer.off("audio:loopback-data", callback);
      };
   },

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

   // Shell
   openExternal: (url: string) => ipcRenderer.send("shell:open-external", url),
   getOsInfo: () => ipcRenderer.invoke("shell:get-os-info") as Promise<OsInfo>,

   // CLI
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
   getOpenApplications: () => ipcRenderer.invoke("native:get-open-applications") as Promise<ApplicationInfo[]>,
   // getApplicationInfo: (processId: number) =>
   //    ipcRenderer.invoke("native:get-application-info", processId) as Promise<{ displayName: string | null; icon: string | null }>,

   // Voice debug
   openVoiceDebug: () => ipcRenderer.send("voice-debug:open"),
   closeVoiceDebug: () => ipcRenderer.send("voice-debug:close"),
   isVoiceDebugOpen: () => ipcRenderer.invoke("voice-debug:is-open") as Promise<boolean>,

   // App
   setProxy: (useSystemProxy: boolean) => ipcRenderer.invoke("app:set-proxy", useSystemProxy),
};

contextBridge.exposeInMainWorld("electronAPI", electronAPI);
