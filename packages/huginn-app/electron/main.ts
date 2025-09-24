import path from "node:path";
import { CacheStorage, error, findClosestString, log, logger, type LogArgs } from "@huginn/shared";
import { getActiveWindowProcessIds, setExecutablesRoot, startAudioCapture, stopAudioCapture } from "application-loopback";
import { app, BrowserWindow, desktopCapturer, dialog, ipcMain, Menu, nativeImage, Notification, session, shell, Tray } from "electron";
import updater from "electron-updater";
import type { AudioSource, DisplaySource } from "@/types";
import * as file from "./file-controller";
import * as cacheController from "./cache-controller";
import * as keybindsController from "./keybinds-controller";
import native, { type AppInfo } from "native-addon";
import { RemoteLogger } from "../shared/remote-logger";
import { randomUUID } from "node:crypto";

const { autoUpdater, CancellationToken } = updater;

const fileController = new file.FileController();
await fileController.tryMigrate();

// application-loopback executable path when packaged
if (app.isPackaged) {
   setExecutablesRoot(path.resolve(import.meta.dirname, "..", "..", "app.asar.unpacked", "node_modules", "application-loopback", "bin"));
}

await setupClientInfo();
configureUpdater();
const remoteLogger = await setupLogger();

let gotLock: boolean;
try {
   if (process.defaultApp) {
      if (process.argv.length >= 2) {
         const args = process.argv[1];
         log("app:electron", "default", "set deep link", "exep:", process.execPath, "args:", args);

         app.setAsDefaultProtocolClient("huginn", process.execPath, [path.resolve(args)]);
      }
   } else {
      app.setAsDefaultProtocolClient("huginn");
   }

   gotLock = app.requestSingleInstanceLock();

   if (!gotLock) {
      dialog.showErrorBox(
         "Already running",
         "Huginn is already running! If you believe this is false, check your task-manager for any dead processes named 'Huginn'",
      );

      log("app:electron", "default", "exit because of lock");

      app.exit();
   }
} catch (e) {
   error("app:electron", "default protocol register or single instance lock failed:", e);
}

async function createWindow() {
   try {
      // Create the browser window.
      const mainWindow = new BrowserWindow({
         minWidth: 1200,
         minHeight: 670,
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

      if (process.env.VITE_DEV_SERVER_URL) {
         log("app:electron", "default", "load", "url:", process.env.VITE_DEV_SERVER_URL);

         mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
      } else {
         const filePath = path.join(import.meta.dirname, "../dist/index.html");
         log("app:electron", "default", "load", "url:", filePath);

         mainWindow.loadFile(filePath);
      }

      // Open the DevTools.
      // mainWindow.webContents.openDevTools({ mode: "undocked"});

      await listenToEvents(mainWindow);
      configureTray(mainWindow);
   } catch (e) {
      error("app:electron", "window creation failed:", e);
   }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on("ready", async () => {
   log("app:electron", "recv", "app ready");

   // autoUpdater.quitAndInstall(true, true);
   if (!gotLock) {
      return;
   }

   await createWindow();

   // Setup as Startup App
   log("app:electron", "default", "set startup");
   app.setLoginItemSettings({ openAtLogin: true, path: app.getPath("exe"), args: ["--silent"] });
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on("window-all-closed", () => {
   log("app:electron", "recv", "app all windows closed");

   if (process.platform !== "darwin") {
      app.quit();
   }
});

app.on("activate", () => {
   log("app:electron", "recv", "app activate");
   // On OS X it's common to re-create a window in the app when the
   // dock icon is clicked and there are no other windows open.
   if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
   }
});

function configureUpdater() {
   try {
      log("app:electron", "default", "configure updater");
      // autoUpdater.setFeedURL({ useMultipleRangeRequest: false, url: "", provider: "generic" })
      autoUpdater.autoInstallOnAppQuit = false;
      autoUpdater.allowDowngrade = true;
      autoUpdater.autoDownload = false;

      autoUpdater.on("error", (e) => {
         error("app:electron", "updater error:", e);
      });

      autoUpdater.on("update-not-available", () => {
         log("app:electron", "updater", "not available");
      });

      autoUpdater.on("checking-for-update", () => {
         log("app:electron", "updater", "check for update");
      });

      autoUpdater.on("update-cancelled", () => {
         log("app:electron", "updater", "check for update");
      });

      autoUpdater.on("update-available", () => {
         log("app:electron", "updater", "available");
      });

      autoUpdater.on("update-downloaded", () => {
         log("app:electron", "updater", "downloaded");
         autoUpdater.quitAndInstall(true, true);
      });
   } catch (e) {
      error("app:electron", "updater config failed:", e);
   }
}

function configureTray(mainWindow: BrowserWindow) {
   log("app:electron", "default", "configure tray");

   const tray = new Tray(app.isPackaged ? path.join(process.resourcesPath, "assets", "icon.ico") : "./assets/icon.ico");
   const contextMenu = Menu.buildFromTemplate([
      {
         label: "Quit",
         type: "normal",
         click: () => {
            app.exit();
         },
      },
   ]);

   tray.setContextMenu(contextMenu);
   tray.setToolTip("Huginn");

   tray.on("click", () => {
      mainWindow.show();
   });
}

let selectedSourceId: string;

async function listenToEvents(mainWindow: BrowserWindow) {
   log("app:electron", "default", "listen to events");

   file.listenToEvents(fileController);
   await cacheController.listenToEvents();
   keybindsController.listenToEvents(mainWindow);

   session.defaultSession.setDisplayMediaRequestHandler(async (request, callback) => {
      const sources = await desktopCapturer.getSources({
         types: ["screen", "window"],
         thumbnailSize: { height: 0, width: 0 },
         fetchWindowIcons: false,
      });
      const source = sources.find((x) => x.id === selectedSourceId);

      const audio = request.audioRequested && source?.id.includes("screen") ? "loopback" : undefined;
      callback({ video: source, ...(audio ? { audio: audio } : {}), enableLocalEcho: false });
   });

   mainWindow.on("close", (e) => {
      log("app:electron", "recv", "close");

      e.preventDefault();
      mainWindow.hide();
   });

   mainWindow.on("maximize", () => {
      log("app:electron", "recv", "maximize");

      log("app:electron", "send", "window is maximized", true);
      mainWindow.webContents.send("window:is-maximized", true);
   });

   mainWindow.on("unmaximize", () => {
      log("app:electron", "recv", "unmaximize");

      log("app:electron", "send", "window is maximized", false);
      mainWindow.webContents.send("window:is-maximized", false);
   });

   mainWindow.on("restore", () => {
      log("app:electron", "recv", "restore");

      log("app:electron", "send", "window is maximized", false);
      mainWindow.webContents.send("window:is-maximized", false);
   });

   mainWindow.on("enter-full-screen", () => {
      log("app:electron", "recv", "enter full screen");

      log("app:electron", "send", "window is maximized", true);
      mainWindow.webContents.send("window:is-maximized", true);

      log("app:electron", "send", "window is fullscreen", true);
      mainWindow.webContents.send("window:is-fullscreen", true);
   });

   mainWindow.on("leave-full-screen", () => {
      log("app:electron", "recv", "leave full screen");

      log("app:electron", "send", "window is maximized", false);
      mainWindow.webContents.send("window:is-maximized", false);

      log("app:electron", "send", "window is fullscreen", false);
      mainWindow.webContents.send("window:is-fullscreen", false);
   });

   ipcMain.handle("window:version", () => {
      log("app:electron", "recv", "window version");

      return app.getVersion();
   });

   // ipcMain.on("window:splashscreen-mode", () => {
   //    mainWindow.setMinimumSize(300, 300);
   //    mainWindow.setSize(300, 300);
   //    // mainWindow.center();
   //    mainWindow.setResizable(false);
   // });

   // ipcMain.on("window:main-mode", () => {
   //    mainWindow.setResizable(true);
   //    mainWindow.setMinimumSize(1200, 670);
   //    mainWindow.setSize(1200, 670);
   //    // mainWindow.center();
   // });

   ipcMain.on("window:set-fullscreen", (_, fullscreen: boolean) => {
      log("app:electron", "recv", "window set fullscreen");

      mainWindow.setFullScreen(fullscreen);
   });

   ipcMain.on("window:show-main", () => {
      log("app:electron", "recv", "window show main");

      mainWindow.show();
   });
   ipcMain.on("window:hide-main", () => {
      log("app:electron", "recv", "window hide main");

      mainWindow.hide();
   });
   ipcMain.on("window:focus-main", () => {
      log("app:electron", "recv", "window focus main");

      mainWindow.focus();
   });
   ipcMain.on("window:minimize", () => {
      log("app:electron", "recv", "window minimize");

      mainWindow.minimize();
   });
   ipcMain.on("window:toggle-maximize", () => {
      log("app:electron", "recv", "window toggle maximize");

      if (mainWindow.isMaximized()) {
         mainWindow.restore();
      } else {
         mainWindow.maximize();
      }
   });

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

      mainWindow.webContents.send("update:progress", e);
   });

   ipcMain.handle("cli:get-args", () => {
      log("app:electron", "recv", "cli get args");

      return process.argv;
   });

   app.on("second-instance", (_event, commandLine, _workingDirectory, _additionalData) => {
      const cmd = commandLine.pop();

      log("app:electron", "recv", "second instance", "cmd:", cmd);

      if (cmd?.startsWith("huginn://")) {
         log("app:electron", "send", "cli deep link", "cmd:", cmd);
         mainWindow.webContents.send("cli:deep-link", cmd);
      }

      mainWindow.show();
      mainWindow.focus();
   });

   ipcMain.on("shell:open-external", (_, url: string) => {
      log("app:electron", "recv", "shell open external", "url:", url);

      shell.openExternal(url);
   });

   ipcMain.on("notification:send", (_, data: { title: string; body: string; payload?: string; icon?: string }) => {
      log("app:electron", "recv", "notification send", "title:", data.title, "body:", data.body, "pld:", data.payload);

      const icon = data.icon
         ? nativeImage.createFromPath(path.join(cacheController.cacheDir, `${data.icon}.png`))
         : app.isPackaged
           ? path.join(process.resourcesPath, "assets", "icon.ico")
           : "./assets/icon.ico";

      const notification = new Notification({
         title: data.title,
         body: data.body,
         icon: icon,

         silent: true,
      });

      notification.on("click", () => {
         log("app:electron", "send", "notification clicked", "pld:", data.payload);

         mainWindow.webContents.send("notification:clicked", data.payload);
      });

      notification.show();
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
         .map((x) => ({ thumbnail: x.thumbnail.toDataURL(), id: x.id, name: x.name, appIcon: x.appIcon?.toDataURL() }) as DisplaySource);
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

      selectedSourceId = sourceId;
   });

   ipcMain.on("window:relaunch", () => {
      log("app:electron", "recv", "relaunch");

      app.relaunch();
      app.exit();
   });

   let previousProcessId: string | undefined;
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
               log("app:electron", "loopback-send", "d:", data);

               mainWindow.webContents.send("audio:loopback-data", data);
            },
         });

         previousProcessId = foundProcessId;
         return true;
      } else {
         error("app:electron", `Couldn't find process with title: ${processTitle}`);

         return false;
      }
   });

   ipcMain.handle("audio:stop-loopback", () => {
      log("app:electron", "recv", "audio stop loopback", "pid:", previousProcessId);

      if (previousProcessId) {
         log("app:electron", "loopback", "stop", "pid:", previousProcessId);
         stopAudioCapture(previousProcessId);
      }
   });

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

   ipcMain.on("logger:add-to-buffer", (_, type: "log" | "error", section: string, level: string | undefined, ...args: LogArgs[]) => {
      remoteLogger?.addToBuffer(type, section, level, ...args);
   });
}

async function setupLogger() {
   try {
      const {
         data: { apiHostname },
      } = await fileController.loadFile("settings");

      const { data: info } = await fileController.loadFile("client-info");
      const endpoint = new URL("/api/log", apiHostname).toString();
      logger.enableLogs({ "app:electron": ["default", "loopback", "recv", "send", "updater", "file-controller"] });
      return new RemoteLogger(logger, endpoint, info.id);
   } catch (e) {
      error("app:electron", "logger setup failed:", e);
   }
}

async function setupClientInfo() {
   try {
      const value = await fileController.loadFile("client-info");
      if (value.created || !value.data.id) {
         value.data.id = randomUUID();
         await fileController.saveFile("client-info", value.data);
      }
   } catch (e) {
      error("app:electron", "client info setup failed:", e);
   }
}
