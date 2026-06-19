import { analytics, CacheStorage, error, findClosestString, log } from "@huginn/shared";
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

   public override eventListeners(window: BrowserWindow): void {
      keybindsController.listenToEvents(window);

      this.windowEvents(window);
      this.windowCategoryEvents(window);
      this.updateCategoryEvents(window);
      this.shellCategoryEvents();
      this.audioCategoryEvents(window);
      this.notificationCategoryEvents(window);
      this.nativeCategoryEvents();
      this.sessionEvents();
      this.voiceDebugCategoryEvents();
   }

   private sessionEvents() {
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

   private windowEvents(window: BrowserWindow) {
      window.on("close", (e) => {
         log("app:electron", "recv", "close");

         e.preventDefault();
         window.hide();
      });

      window.on("maximize", () => {
         log("app:electron", "recv", "maximize");

         log("app:electron", "send", "window is maximized", true);
         window.webContents.send("window:is-maximized", true);
      });

      window.on("unmaximize", () => {
         log("app:electron", "recv", "unmaximize");

         log("app:electron", "send", "window is maximized", false);
         window.webContents.send("window:is-maximized", false);
      });

      window.on("restore", () => {
         log("app:electron", "recv", "restore");

         log("app:electron", "send", "window is maximized", false);
         window.webContents.send("window:is-maximized", false);
      });

      window.on("enter-full-screen", () => {
         log("app:electron", "recv", "enter full screen");

         log("app:electron", "send", "window is maximized", true);
         window.webContents.send("window:is-maximized", true);

         log("app:electron", "send", "window is fullscreen", true);
         window.webContents.send("window:is-fullscreen", true);
      });

      window.on("leave-full-screen", () => {
         log("app:electron", "recv", "leave full screen");

         log("app:electron", "send", "window is maximized", false);
         window.webContents.send("window:is-maximized", false);

         log("app:electron", "send", "window is fullscreen", false);
         window.webContents.send("window:is-fullscreen", false);
      });
   }

   private windowCategoryEvents(window: BrowserWindow) {
      ipcMain.handle("window:version", () => {
         log("app:electron", "recv", "window version");

         return app.getVersion();
      });

      ipcMain.on("window:set-fullscreen", (_, fullscreen: boolean) => {
         log("app:electron", "recv", "window set fullscreen");

         window.setFullScreen(fullscreen);
      });

      ipcMain.on("window:show-main", () => {
         log("app:electron", "recv", "window show main");

         window.show();
      });

      ipcMain.on("window:hide-main", () => {
         log("app:electron", "recv", "window hide main");

         window.hide();
      });

      ipcMain.on("window:focus-main", () => {
         log("app:electron", "recv", "window focus main");

         window.focus();
      });

      ipcMain.on("window:minimize", () => {
         log("app:electron", "recv", "window minimize");

         window.minimize();
      });

      ipcMain.on("window:toggle-maximize", () => {
         log("app:electron", "recv", "window toggle maximize");

         if (window.isMaximized()) {
            window.restore();
         } else {
            window.maximize();
         }
      });

      ipcMain.handle("window:get-display-sources", async () => {
         log("app:electron", "recv", "window get display sources");

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
         log("app:electron", "recv", "window get audio sources");

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
         log("app:electron", "recv", "window set selected display source", "sid:", sourceId);

         this.selectedSourceId = sourceId;
      });

      ipcMain.on("window:relaunch", () => {
         log("app:electron", "recv", "relaunch");

         if (app.isPackaged) {
            app.relaunch({ args: process.argv.filter((x) => !x.includes("silent")) });
            app.exit();
         } else {
            window.webContents.reload();
         }
      });

      ipcMain.handle("window:process-id", () => {
         log("app:electron", "recv", "window process id");

         return process.pid;
      });
   }

   private updateCategoryEvents(window: BrowserWindow) {
      ipcMain.handle("update:check", async () => {
         log("app:electron", "recv", "update check");

         const result = await autoUpdater.checkForUpdates();
         return result?.updateInfo;
      });

      ipcMain.on("update:download", async () => {
         log("app:electron", "recv", "update download");

         const cancel = new CancellationToken();
         await autoUpdater.downloadUpdate(cancel);
      });

      ipcMain.on("update:set-url", (_, url: string) => {
         log("app:electron", "updater", "set url", "u:", url);

         autoUpdater.setFeedURL({ provider: "generic", url, useMultipleRangeRequest: false });
      });

      autoUpdater.on("download-progress", (e) => {
         log("app:electron", "updater", "download progress");

         window.webContents.send("update:progress", e);
      });
   }

   private shellCategoryEvents() {
      ipcMain.on("shell:open-external", (_, url: string) => {
         log("app:electron", "recv", "shell open external", "url:", url);

         shell.openExternal(url);
      });
   }

   private notificationCategoryEvents(window: BrowserWindow) {
      ipcMain.on("notification:send", (_, data: { title: string; body: string; payload?: string; icon?: string }) => {
         log("app:electron", "recv", "notification send", "title:", data.title, "body:", data.body, "pld:", data.payload);

         // const icon = nativeImage.createFromDataURL(
         //    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAApgAAAKYB3X3/OAAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAANCSURBVEiJtZZPbBtFFMZ/M7ubXdtdb1xSFyeilBapySVU8h8OoFaooFSqiihIVIpQBKci6KEg9Q6H9kovIHoCIVQJJCKE1ENFjnAgcaSGC6rEnxBwA04Tx43t2FnvDAfjkNibxgHxnWb2e/u992bee7tCa00YFsffekFY+nUzFtjW0LrvjRXrCDIAaPLlW0nHL0SsZtVoaF98mLrx3pdhOqLtYPHChahZcYYO7KvPFxvRl5XPp1sN3adWiD1ZAqD6XYK1b/dvE5IWryTt2udLFedwc1+9kLp+vbbpoDh+6TklxBeAi9TL0taeWpdmZzQDry0AcO+jQ12RyohqqoYoo8RDwJrU+qXkjWtfi8Xxt58BdQuwQs9qC/afLwCw8tnQbqYAPsgxE1S6F3EAIXux2oQFKm0ihMsOF71dHYx+f3NND68ghCu1YIoePPQN1pGRABkJ6Bus96CutRZMydTl+TvuiRW1m3n0eDl0vRPcEysqdXn+jsQPsrHMquGeXEaY4Yk4wxWcY5V/9scqOMOVUFthatyTy8QyqwZ+kDURKoMWxNKr2EeqVKcTNOajqKoBgOE28U4tdQl5p5bwCw7BWquaZSzAPlwjlithJtp3pTImSqQRrb2Z8PHGigD4RZuNX6JYj6wj7O4TFLbCO/Mn/m8R+h6rYSUb3ekokRY6f/YukArN979jcW+V/S8g0eT/N3VN3kTqWbQ428m9/8k0P/1aIhF36PccEl6EhOcAUCrXKZXXWS3XKd2vc/TRBG9O5ELC17MmWubD2nKhUKZa26Ba2+D3P+4/MNCFwg59oWVeYhkzgN/JDR8deKBoD7Y+ljEjGZ0sosXVTvbc6RHirr2reNy1OXd6pJsQ+gqjk8VWFYmHrwBzW/n+uMPFiRwHB2I7ih8ciHFxIkd/3Omk5tCDV1t+2nNu5sxxpDFNx+huNhVT3/zMDz8usXC3ddaHBj1GHj/As08fwTS7Kt1HBTmyN29vdwAw+/wbwLVOJ3uAD1wi/dUH7Qei66PfyuRj4Ik9is+hglfbkbfR3cnZm7chlUWLdwmprtCohX4HUtlOcQjLYCu+fzGJH2QRKvP3UNz8bWk1qMxjGTOMThZ3kvgLI5AzFfo379UAAAAASUVORK5CYII=",
         // );
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
               log("app:electron", "send", "notification clicked", "pld:", data.payload);

               window.webContents.send("notification:clicked", data.payload);
            },
         );
      });
   }

   private audioCategoryEvents(window: BrowserWindow) {
      ipcMain.handle("audio:start-loopback", async (_, processTitle?: string, processId?: string) => {
         log("app:electron", "recv", "audio start loopback", "ptit:", processTitle, "pid:", processId);

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
            log("app:electron", "loopback", "start", "pid:", foundProcessId);

            startAudioCapture(foundProcessId, {
               onData(data) {
                  window.webContents.send("audio:loopback-data", data);
               },
            });

            this.previousProcessId = foundProcessId;
            return true;
         } else {
            error("app:electron", `Couldn't find process with title: ${processTitle}`);

            return false;
         }
      });

      ipcMain.handle("audio:stop-loopback", () => {
         log("app:electron", "recv", "audio stop loopback", "pid:", this.previousProcessId);

         if (this.previousProcessId) {
            log("app:electron", "loopback", "stop", "pid:", this.previousProcessId);
            stopAudioCapture(this.previousProcessId);
         }
      });
   }

   private nativeCategoryEvents() {
      ipcMain.handle("native:get-open-applications", () => {
         log("app:electron", "recv", "native get open applications");

         const applications = native.getOpenApplications();

         return applications;
      });

      const applicationIconCache = new CacheStorage<number, AppInfo>(600);
      ipcMain.handle("native:get-application-info", async (_, exePath: string, processId: number) => {
         log("app:electron", "recv", "native get application info", "exp:", exePath, "pid:", processId);

         const info = await applicationIconCache.cacheOrGet(processId, async () => await native.getApplicationInfo(exePath, processId));
         return info;
      });
   }

   private voiceDebugCategoryEvents() {
      ipcMain.on("voice-debug:open", () => {
         console.log("open voice debug");

         if (this.voiceDebugWindow) {
            this.voiceDebugWindow.window.destroy();
         }
         this.voiceDebugWindow = new VoiceDebugWindow();

         this.voiceDebugWindow.window.on("close", () => {
            this.voiceDebugWindow = undefined;
         });
      });

      ipcMain.on("voice-debug:close", () => {
         log("app:electron", "recv", "close voice debug");

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
