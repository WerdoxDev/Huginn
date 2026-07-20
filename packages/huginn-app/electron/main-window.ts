import { analytics, CacheStorage, findClosestString } from "@huginn/shared";
import { getActiveWindowProcessIds, startAudioCapture, stopAudioCapture } from "application-loopback";
import { app, desktopCapturer, ipcMain, nativeImage, session, shell, screen, type BrowserWindow } from "electron";
import log from "electron-log";
import electronUpdater, { CancellationToken } from "electron-updater";
import native from "native-addon";
import path from "node:path";

import type { AudioSource, DisplaySource, OsInfo } from "@/types";

import { BaseWindow } from "./base-window";
import * as keybindsController from "./keybinds-controller";
import { NotificationController } from "./notification-controller";
import { ScreenManager } from "./screen-manager";
import { VoiceDebugWindow } from "./voice-debug-window";

const { autoUpdater } = electronUpdater;

export class MainWindow extends BaseWindow {
   private selectedDisplaySource?: DisplaySource;
   private previousProcessId: string | undefined;
   private voiceDebugWindow?: VoiceDebugWindow;
   private notificationController: NotificationController = new NotificationController();
   private screenManager: ScreenManager = new ScreenManager();

   public constructor() {
      super("main", {
         minWidth: 1024,
         minHeight: 500,
         width: 1280,
         height: 700,
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
         if (!this.selectedDisplaySource) {
            callback({});
            return;
         }
         const audio = request.audioRequested && this.selectedDisplaySource.electronId.includes("screen") ? "loopback" : undefined;
         callback({
            video: { id: this.selectedDisplaySource.electronId, name: this.selectedDisplaySource.name },
            ...(audio ? { audio: audio } : {}),
            enableLocalEcho: false,
         });
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
         return await analytics.startActiveSpan("electronMain.getDisplaySources", async (span) => {
            const screens = screen.getAllDisplays();

            span.setAttribute("screen.count", screens.length);

            const applications = await Promise.all(
               native.getOpenApplications().map(async (x) => {
                  const [icon, thumbnail] = await Promise.all([
                     native.getProcessIconBase64(x.processId),
                     native.getWindowThumbnailBase64(x.hwnd, 256, 256),
                  ]);
                  return { ...x, icon, thumbnail };
               }),
            );

            span.setAttribute("application.count", applications.length);

            const screenSources: DisplaySource[] = await Promise.all(
               screens.map(async (x, i) => {
                  const rect = screen.dipToScreenRect(null, x.bounds);
                  const thumbnail = await native.getScreenThumbnailBase64(rect.x, rect.y, rect.width, rect.height);
                  const electronId = this.screenManager.getDisplaySourceId(x.id);
                  return {
                     thumbnail: thumbnail,
                     electronId: `${electronId}`,
                     name: `Screen ${i + 1}`,
                  } as DisplaySource;
               }),
            );

            span.setAttribute("screen_source.count", screenSources.length);

            const applicationSources: DisplaySource[] = applications.map(
               (x) =>
                  ({
                     thumbnail: x.thumbnail,
                     electronId: `window:${x.hwnd}:0`,
                     name: x.windowTitle,
                     appIcon: x.icon,
                  }) as DisplaySource,
            );

            span.setAttribute("application_source.count", applicationSources.length);

            return [...screenSources, ...applicationSources];
         });
      });

      ipcMain.handle("window:get-audio-sources", async () => {
         const applications = await Promise.all(
            native.getOpenApplications().map(async (x) => {
               const icon = await native.getProcessIconBase64(x.processId);
               return { ...x, icon };
            }),
         );

         const audioSources: AudioSource[] = applications.map(
            (x) =>
               ({
                  processId: x.processId,
                  name: x.windowTitle,
                  appIcon: x.icon,
               }) as AudioSource,
         );

         return audioSources;
      });

      ipcMain.on("window:set-selected-display-source", (_, source: DisplaySource) => {
         this.selectedDisplaySource = source;
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
      log.transports.file.level = "debug";
      autoUpdater.logger = log;

      ipcMain.handle("update:check", async () => {
         const result = await autoUpdater.checkForUpdates();
         return result?.updateInfo;
      });

      ipcMain.on("update:download", async () => {
         const cancel = new CancellationToken();
         await autoUpdater.downloadUpdate(cancel);
      });

      ipcMain.on("update:set-url", (_, url: string) => {
         if (process.env.FORCE_UPDATE_PUBLISHER === "1") return;
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

      ipcMain.handle("shell:get-os-info", () => {
         return {
            platform: process.platform,
            arch: process.arch,
            version: process.getSystemVersion(),
            chromeVersion: process.versions.chrome,
            electronVersion: process.versions.electron,
         } as OsInfo;
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
      ipcMain.handle("audio:start-loopback", async (_, processTitle?: string, processId?: number) => {
         let foundProcessId: string | undefined;
         if (processTitle) {
            const processIds = await getActiveWindowProcessIds();
            const bestTitleMatch = findClosestString(
               processTitle,
               processIds.map((x) => x.title),
            );
            foundProcessId = processIds.find((x) => x.title === bestTitleMatch.match)?.processId;
         } else if (processId) {
            foundProcessId = processId.toString();
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
      ipcMain.handle("native:get-open-applications", async () => {
         const applications = await Promise.all(
            native.getOpenApplications().map(async (x) => {
               const [icon, displayName] = await Promise.all([native.getProcessIconBase64(x.processId), native.getPackageDisplayName(x.processId)]);
               return { ...x, icon, displayName };
            }),
         );

         return applications;
      });

      // const applicationIconCache = new CacheStorage<number, AppInfo | null>(600);
      ipcMain.handle("native:get-application-info", async (_, processId: number) => {
         // const info = await applicationIconCache.cacheOrGet(processId, async () => await native.getApplicationInfo(processId));
         const icon = await native.getProcessIconBase64(processId);
         const displayName = native.getPackageDisplayName(processId);
         const info = { displayName, icon };
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
