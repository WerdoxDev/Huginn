import { analytics } from "@huginnjs/shared";
import { app, BrowserWindow, ipcMain, nativeImage, session, shell, screen } from "electron";
import log from "electron-log";
import electronUpdater, { CancellationToken } from "electron-updater";
import loopback, { type LoopbackCapture } from "loopback-capture";
import native from "native-addon";
import path from "node:path";

import type { AudioSource, DisplaySource, OsInfo } from "@/types";

import { BaseWindow } from "./base-window";
import * as keybindsController from "./keybinds-controller";
import { NotificationController } from "./notification-controller";
import { ScreenManager } from "./screen-manager";
import { isLinux, isWindows } from "./utils";

const { autoUpdater } = electronUpdater;

export class MainWindow extends BaseWindow {
   private selectedDisplaySource?: DisplaySource;
   private notificationController: NotificationController = new NotificationController();
   private screenManager: ScreenManager = new ScreenManager();
   private loopbackCapture: LoopbackCapture | undefined;
   private nativeCaptureOptions?: { captureId: string; width: number; height: number; frameRate: number };

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
            nodeIntegrationInSubFrames: true,
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
      this.registerNativeEvents(window);
      this.registerSessionEvents();
      this.registerMediaEvents(window);
   }

   private registerSessionEvents() {
      session.defaultSession.setDisplayMediaRequestHandler(async (request, callback) => {
         try {
            if (!this.selectedDisplaySource) {
               callback({});
               return;
            }

            callback({
               video: request.videoRequested ? { id: this.selectedDisplaySource.electronId, name: this.selectedDisplaySource.name } : undefined,
               audio: undefined,
               enableLocalEcho: false,
            });
         } catch (e) {
            console.error("Error handling display media request:", e);
            callback({});
         }
      });
   }

   private registerElectronWindowEvents(window: BrowserWindow) {
      window.webContents.setWindowOpenHandler(({ features }) => {
         const width = features.includes("width=") ? parseInt(features.split("width=")[1].split(",")[0]) : 1024;
         const height = features.includes("height=") ? parseInt(features.split("height=")[1].split(",")[0]) : 700;

         return {
            action: "allow",
            overrideBrowserWindowOptions: {
               width: width,
               height: height,
               frame: true,
               webPreferences: {
                  contextIsolation: true,
                  nodeIntegration: true,
                  preload: path.join(import.meta.dirname, "preload.mjs"),
                  backgroundThrottling: false,
               },
            },
         };
      });

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

      ipcMain.on("window:focus-media-popout", (_, producerId: string) => {
         const mediaWindow = BrowserWindow.getAllWindows().find((candidate) => {
            try {
               return new URL(candidate.webContents.getURL()).searchParams.get("voiceMediaProducerId") === producerId;
            } catch {
               return false;
            }
         });

         if (!mediaWindow) return;
         if (mediaWindow.isMinimized()) mediaWindow.restore();

         mediaWindow.show();
         mediaWindow.focus();
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
            const screens = await this.screenManager.getAllDisplays();

            span.setAttribute("screen.count", screens.length);

            const openApplications = await native.getOpenApplications();

            const applications = await Promise.all(
               openApplications.map(async (x) => {
                  const [icon, thumbnail] = await Promise.all([
                     native.getProcessIconBase64(x.processId),
                     isLinux && x.rect && x.stableId
                        ? native.getWindowThumbnailBase64LINUX(x.stableId, 1)
                        : x.hwnd
                          ? native.getWindowThumbnailBase64WIN(x.hwnd, 256, 256)
                          : undefined,
                  ]);
                  return { ...x, icon, thumbnail };
               }),
            );

            span.setAttribute("application.count", applications.length);

            const screenSources: DisplaySource[] = await Promise.all(
               screens.map(async (x, i) => {
                  const rect = isLinux ? x.bounds : screen.dipToScreenRect(null, x.bounds);
                  const thumbnail = await native.getScreenThumbnailBase64(rect.x, rect.y, rect.width, rect.height);
                  const electronId = this.screenManager.getDisplaySourceId(x.id);
                  return {
                     thumbnail: thumbnail,
                     electronId: `${electronId ?? `screen:${x.id}`}`,
                     name: `Screen ${i + 1}`,
                     processId: undefined,
                  } as DisplaySource;
               }),
            );

            span.setAttribute("screen_source.count", screenSources.length);

            const applicationSources: DisplaySource[] = applications.map(
               (x) =>
                  ({
                     thumbnail: x.thumbnail,
                     electronId: `window:${x.hwnd ?? x.processId}:0`,
                     name: x.windowTitle,
                     appIcon: x.icon,
                     processId: x.processId,
                  }) as DisplaySource,
            );

            span.setAttribute("application_source.count", applicationSources.length);

            return [...screenSources, ...applicationSources];
         });
      });

      ipcMain.handle("window:get-audio-sources", async () => {
         const openApplications = await native.getOpenApplications();
         const applications = await Promise.all(
            openApplications.map(async (x) => {
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
         if (process.env.VITE_PUBLIC_DEV_UPDATE_PUBLISHER_URL) return;
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
      ipcMain.on("audio:start-loopback", (_, mode: "system" | "application", processId?: number) => {
         this.loopbackCapture = new loopback.LoopbackCapture();

         if (mode === "application" && processId) {
            this.loopbackCapture.start(processId, true, (data) => {
               window.webContents.send("audio:loopback-data", data);
            });
         } else {
            this.loopbackCapture.startSystemAudio((data) => {
               window.webContents.send("audio:loopback-data", data);
            });
         }
      });

      ipcMain.handle("audio:stop-loopback", () => {
         if (this.loopbackCapture) {
            this.loopbackCapture.stop();
            this.loopbackCapture = undefined;
         }
      });
   }

   private registerNativeEvents(window: BrowserWindow) {
      ipcMain.handle("native:get-open-applications", async () => {
         const openApplications = await native.getOpenApplications();
         const applications = await Promise.all(
            openApplications.map(async (x) => {
               if (isWindows) {
                  const [icon, displayName] = await Promise.all([
                     native.getProcessIconBase64(x.processId),
                     native.getPackageDisplayName(x.processId),
                  ]);
                  return { ...x, icon, displayName };
               }

               return { ...x, icon: await native.getProcessIconBase64(x.processId) };
            }),
         );

         return applications;
      });

      ipcMain.on("native:start-desktop-capture", async (_, options: { captureId: string; width: number; height: number; frameRate: number }) => {
         const reportError = (error: unknown) => {
            const message = error instanceof Error ? error.message : String(error);
            if (!window.webContents.isDestroyed()) window.webContents.send("native:capture-error", options.captureId, message);
         };

         if (!this.selectedDisplaySource) {
            reportError(new Error("No display source was selected"));
            return;
         }

         try {
            const displays = await this.screenManager.getAllDisplays();
            const applications = await native.getOpenApplications();

            const screenOrProcessId = this.selectedDisplaySource.electronId.split(":")[1];
            const foundDisplay = displays.find((display) => display.id.toString() === screenOrProcessId);
            const foundApplication = applications.find((app) => app.processId.toString() === screenOrProcessId);

            const width = Math.max(2, Math.floor(options.width / 2) * 2);
            const height = Math.max(2, Math.floor(options.height / 2) * 2);
            const frameRate = Math.max(1, Math.min(60, Math.floor(options.frameRate)));
            if (![width, height, frameRate].every(Number.isFinite)) throw new Error("Invalid capture dimensions or frame rate");

            const previousCaptureId = this.nativeCaptureOptions?.captureId;
            if (previousCaptureId) {
               native.stopDesktopCaptureLINUX();
            }
            this.nativeCaptureOptions = options;

            native.startDesktopCaptureLINUX({
               monitor: foundDisplay?.name,
               rect: foundApplication?.rect ?? undefined,
               width,
               height,
               frameRate,
               callback: (chunk) => {
                  if (this.nativeCaptureOptions?.captureId === options.captureId && !window.webContents.isDestroyed()) {
                     window.webContents.send("native:desktop-capture-chunk", options.captureId, chunk);
                  }
               },
               errorCallback: (error) => {
                  if (this.nativeCaptureOptions?.captureId !== options.captureId) return;

                  this.nativeCaptureOptions = undefined;
                  reportError(error);
               },
            });
         } catch (error) {
            reportError(error);
         }
      });

      ipcMain.on("native:desktop-capture-chunk-consumed", (_, captureId: string) => {
         if (captureId === this.nativeCaptureOptions?.captureId) native.resumeDesktopCaptureLINUX();
      });
      ipcMain.on("native:stop-desktop-capture", (_, captureId?: string, stopStream?: boolean) => {
         if (captureId && captureId !== this.nativeCaptureOptions?.captureId) return;

         const stoppedCaptureId = this.nativeCaptureOptions?.captureId;
         this.nativeCaptureOptions = undefined;
         native.stopDesktopCaptureLINUX();
         if (stoppedCaptureId && !window.webContents.isDestroyed() && stopStream) window.webContents.send("native:capture-stopped", stoppedCaptureId);
      });

      window.once("closed", () => {
         this.nativeCaptureOptions = undefined;
         native.stopDesktopCaptureLINUX();
      });
   }

   private registerMediaEvents(window: BrowserWindow) {
      ipcMain.handle("media:download", async (_event, input: { url: string; filename: string }) => {
         const url = new URL(input.url);

         if (url.protocol !== "https:" && url.protocol !== "http:") {
            throw new Error("Unsupported media URL");
         }

         window.webContents.session.once("will-download", (_event, item) => {
            item.setSaveDialogOptions({
               defaultPath: path.basename(input.filename),
            });
         });

         window.webContents.downloadURL(url.toString());
      });
   }
}
