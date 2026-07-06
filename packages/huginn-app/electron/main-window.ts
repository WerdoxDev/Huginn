import { CacheStorage, findClosestString } from "@huginn/shared";
import { getActiveWindowProcessIds, startAudioCapture, stopAudioCapture } from "application-loopback";
import { app, desktopCapturer, ipcMain, nativeImage, session, shell, type BrowserWindow } from "electron";
import electronUpdater, { CancellationToken } from "electron-updater";
import native, { type AppInfo } from "native-addon";
import path from "node:path";

import type { AudioSource, DisplaySource } from "@/types";

import { BaseWindow } from "./base-window";
import * as keybindsController from "./keybinds-controller";
import { NotificationController } from "./notification-controller";
import { VoiceDebugWindow } from "./voice-debug-window";

const { autoUpdater } = electronUpdater;

export class MainWindow extends BaseWindow {
   private selectedSourceId?: string;
   private previousProcessId: string | undefined;
   private notificationController: NotificationController;
   private voiceDebugWindow?: VoiceDebugWindow;

   public constructor() {
      super("main", {
         minWidth: 850,
         minHeight: 380,
         width: 1200,
         height: 670,
         fullscreen: false,
         frame: false,
         titleBarStyle: "hidden",
         webPreferences: {
            contextIsolation: true,
            nodeIntegration: true,
            preload: path.join(import.meta.dirname, "preload.mjs"),
            backgroundThrottling: false,
         },
         show: false,
      });

      this.notificationController = new NotificationController();
   }

   public override registerEvents(window: BrowserWindow): void {
      keybindsController.registerEvents(window);

      this.registerElectronWindowEvents(window);
      this.registerWindowEvents(window);
      this.registerUpdateEvents(window);
      this.registerShellEvents();
      this.registerAudioEvents(window);
      this.registerNotificationEvents(window);
      this.registerNativeEvents();
      this.registerSessionEvents();
      this.registerVoiceDebugEvents();
   }

   private registerSessionEvents() {
      session.defaultSession.setDisplayMediaRequestHandler(async (request, callback) => {
         const sources = await desktopCapturer.getSources({
            types: ["screen", "window"],
            thumbnailSize: { height: 0, width: 0 },
            fetchWindowIcons: false,
         });
         const source = sources.find((x) => x.id === this.selectedSourceId);

         const audio = request.audioRequested && source?.id.includes("screen") ? "loopback" : undefined;
         callback({ video: source, ...(audio ? { audio: audio } : {}), enableLocalEcho: false });
      });
   }

   private registerElectronWindowEvents(window: BrowserWindow) {
      window.on("close", (e) => {
         e.preventDefault();
         window.hide();
      });

      window.on("maximize", () => {
         window.webContents.send("window:is-maximized", true);
      });

      window.on("unmaximize", () => {
         window.webContents.send("window:is-maximized", false);
      });

      window.on("restore", () => {
         window.webContents.send("window:is-maximized", false);
      });

      window.on("enter-full-screen", () => {
         window.webContents.send("window:is-maximized", true);
         window.webContents.send("window:is-fullscreen", true);
      });

      window.on("leave-full-screen", () => {
         window.webContents.send("window:is-maximized", false);
         window.webContents.send("window:is-fullscreen", false);
      });
   }

   private registerWindowEvents(window: BrowserWindow) {
      ipcMain.handle("window:version", () => {
         return app.getVersion();
      });

      ipcMain.on("window:set-fullscreen", (_, fullscreen: boolean) => {
         window.setFullScreen(fullscreen);
      });

      ipcMain.on("window:show-main", () => {
         window.show();
      });

      ipcMain.on("window:hide-main", () => {
         window.hide();
      });

      ipcMain.on("window:focus-main", () => {
         window.focus();
      });

      ipcMain.on("window:minimize", () => {
         window.minimize();
      });

      ipcMain.on("window:toggle-maximize", () => {
         if (window.isMaximized()) {
            window.restore();
         } else {
            window.maximize();
         }
      });

      ipcMain.handle("window:get-display-sources", async () => {
         const sources = await desktopCapturer.getSources({
            types: ["screen", "window"],
            fetchWindowIcons: true,
            thumbnailSize: { width: 300, height: 300 },
         });

         return sources
            .filter((x) => !x.thumbnail.isEmpty())
            .map(
               (x) =>
                  ({
                     thumbnail: x.thumbnail.toDataURL(),
                     id: x.id,
                     name: x.name,
                     appIcon: x.appIcon?.toDataURL(),
                  }) as DisplaySource,
            );
      });

      ipcMain.handle("window:get-audio-sources", async () => {
         const sources = await desktopCapturer.getSources({
            types: ["window"],
            fetchWindowIcons: true,
            thumbnailSize: { width: 300, height: 300 },
         });
         const processes = await getActiveWindowProcessIds();

         return sources
            .map((source) => {
               const bestTitleMatch = findClosestString(
                  source.name,
                  processes.map((x) => x.title),
               );
               const process = processes.find((x) => x.title === bestTitleMatch.match);
               return process
                  ? {
                       processId: process.processId,
                       name: source.name,
                       appIcon: source.appIcon?.toDataURL(),
                    }
                  : null;
            })
            .filter((x) => x !== null && !sources[0].thumbnail.isEmpty()) as AudioSource[];
      });

      ipcMain.on("window:set-selected-display-source", (_, sourceId: string) => {
         this.selectedSourceId = sourceId;
      });

      ipcMain.on("window:relaunch", () => {
         if (app.isPackaged) {
            app.relaunch({ args: process.argv.filter((x) => !x.includes("silent")) });
            app.exit();
         } else {
            window.webContents.reload();
         }
      });

      ipcMain.handle("window:process-id", () => {
         return process.pid;
      });
   }

   private registerUpdateEvents(window: BrowserWindow) {
      ipcMain.handle("update:check", async () => {
         const result = await autoUpdater.checkForUpdates();
         return result?.updateInfo;
      });

      ipcMain.on("update:download", async () => {
         const cancel = new CancellationToken();
         await autoUpdater.downloadUpdate(cancel);
      });

      ipcMain.on("update:set-url", (_, url: string) => {
         autoUpdater.setFeedURL({ provider: "generic", url, useMultipleRangeRequest: false });
      });

      autoUpdater.on("download-progress", (e) => {
         window.webContents.send("update:progress", e);
      });
   }

   private registerShellEvents() {
      ipcMain.on("shell:open-external", (_, url: string) => {
         shell.openExternal(url);
      });
   }

   private registerNotificationEvents(window: BrowserWindow) {
      ipcMain.on("notification:send", (_, data: { title: string; body: string; payload?: string; icon?: string }) => {
         const icon = data.icon
            ? nativeImage.createFromDataURL(data.icon)
            : app.isPackaged
              ? path.join(process.resourcesPath, "electron-assets", "icon.ico")
              : "./electron-assets/icon.ico";

         this.notificationController.sendNotification(
            {
               title: data.title,
               body: data.body,
               icon: icon,
               silent: true,
            },
            () => {
               window.webContents.send("notification:clicked", data.payload);
            },
         );
      });
   }

   private registerAudioEvents(window: BrowserWindow) {
      ipcMain.handle("audio:start-loopback", async (_, processTitle?: string, processId?: string) => {
         let foundProcessId: string | undefined;
         if (processTitle) {
            const processIds = await getActiveWindowProcessIds();
            const bestTitleMatch = findClosestString(
               processTitle,
               processIds.map((x) => x.title),
            );
            foundProcessId = processIds.find((x) => x.title === bestTitleMatch.match)?.processId;
         } else if (processId) {
            foundProcessId = processId;
         }

         if (foundProcessId) {
            startAudioCapture(foundProcessId, {
               onData(data) {
                  window.webContents.send("audio:loopback-data", data);
               },
            });

            this.previousProcessId = foundProcessId;
            return true;
         } else {
            return false;
         }
      });

      ipcMain.handle("audio:stop-loopback", () => {
         if (this.previousProcessId) {
            stopAudioCapture(this.previousProcessId);
         }
      });
   }

   private registerNativeEvents() {
      ipcMain.handle("native:get-open-applications", () => {
         const applications = native.getOpenApplications();

         return applications;
      });

      const applicationIconCache = new CacheStorage<number, AppInfo | null>(600);
      ipcMain.handle("native:get-application-info", async (_, processId: number) => {
         const info = await applicationIconCache.cacheOrGet(processId, () => native.getApplicationInfo(processId));
         return info;
      });
   }

   private registerVoiceDebugEvents() {
      ipcMain.on("voice-debug:open", () => {
         if (this.voiceDebugWindow) {
            this.voiceDebugWindow.window.destroy();
         }
         this.voiceDebugWindow = new VoiceDebugWindow();

         this.voiceDebugWindow.window.on("close", () => {
            this.voiceDebugWindow = undefined;
         });
      });

      ipcMain.on("voice-debug:close", () => {
         if (this.voiceDebugWindow) {
            this.voiceDebugWindow.window.destroy();
            this.voiceDebugWindow = undefined;
         }
      });

      ipcMain.handle("voice-debug:is-open", () => {
         return this.voiceDebugWindow && this.voiceDebugWindow.window.isVisible();
      });
   }
}
