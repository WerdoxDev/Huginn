import { access, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { enableLogs, error, log } from "@huginn/shared";
import { getActiveWindowProcessIds, startAudioCapture, stopAudioCapture } from "application-loopback";
import { app, BrowserWindow, desktopCapturer, ipcMain, Menu, Notification, session, shell, Tray } from "electron";
import electronLog from "electron-log/main";
import { autoUpdater, CancellationToken } from "electron-updater";
import type { DisplaySource } from "@/types";

// const _dirname = typeof __dirname !== "undefined" ? __dirname : path.dirname(fileURLToPath(import.meta.url));
const _dirname = __dirname;

configureUpdater();

enableLogs({ "app:electron": ["default", "loopback", "recv", "send", "updater"] })

if (process.defaultApp) {
   if (process.argv.length >= 2) {
      const args = process.argv[1];
      log("app:electron", "default", "set deep link", "exep:", process.execPath, "args:", args);

      app.setAsDefaultProtocolClient("huginn", process.execPath, [path.resolve(args)]);
   }
} else {
   app.setAsDefaultProtocolClient("huginn");
}

const gotLock = app.requestSingleInstanceLock();

if (!gotLock) {
   log("app:electron", "default", "exit because of lock");

   app.exit();
}

function createWindow() {
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
         preload: path.join(_dirname, "preload.cjs"),
      },
      show: false,
   });

   if (process.env.VITE_DEV_SERVER_URL) {
      log("app:electron", "default", "load", "url:", process.env.VITE_DEV_SERVER_URL)

      mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
   } else {
      const filePath = path.join(_dirname, "../../dist/index.html")
      log("app:electron", "default", "load", "url:", filePath)

      mainWindow.loadFile(filePath);
   }

   // Open the DevTools.
   // mainWindow.webContents.openDevTools({ mode: "undocked"});

   eventListeners(mainWindow);
   configureTray(mainWindow);
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

   createWindow();

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
   log("app:electron", "default", "configure updater");

   autoUpdater.logger = electronLog;
   autoUpdater.autoInstallOnAppQuit = false;
   autoUpdater.allowDowngrade = true;
   autoUpdater.autoDownload = false;

   autoUpdater.on("error", (e) => {
      error("app:electron", "updater error:", e);

      electronLog.error("UPDATE ERROR", e);
   });

   autoUpdater.on("update-not-available", () => {
      log("app:electron", "updater", "not available");

      electronLog.log("NOT AVAILABLE");
   });

   autoUpdater.on("checking-for-update", () => {
      log("app:electron", "updater", "check for update");
      electronLog.log("CHECKING");
   });

   autoUpdater.on("update-cancelled", () => {
      log("app:electron", "updater", "check for update");
      electronLog.log("cancel");
   });

   autoUpdater.on("update-available", () => {
      log("app:electron", "updater", "available");
      electronLog.log("AVAILABLE!");
   });

   autoUpdater.on("update-downloaded", () => {
      log("app:electron", "updater", "downloaded");
      electronLog.log("DOWNLOADED");
      autoUpdater.quitAndInstall(true, true);
   });
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

function eventListeners(mainWindow: BrowserWindow) {
   log("app:electron", "default", "listen to events");

   session.defaultSession.setDisplayMediaRequestHandler(async (request, callback) => {
      const sources = await desktopCapturer.getSources({
         types: ["screen", "window"],
         thumbnailSize: { height: 0, width: 0 },
         fetchWindowIcons: false,
      });
      const source = sources.find((x) => x.id === selectedSourceId);

      const audio = (request.audioRequested && source?.id.includes("screen")) ? "loopback" : undefined;
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

      return app.getVersion()
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

      mainWindow.show()
   });
   ipcMain.on("window:hide-main", () => {
      log("app:electron", "recv", "window hide main");

      mainWindow.hide()
   });
   ipcMain.on("window:focus-main", () => {
      log("app:electron", "recv", "window focus main");

      mainWindow.focus()
   });
   ipcMain.on("window:minimize", () => {
      log("app:electron", "recv", "window minimize");

      mainWindow.minimize()
   });
   ipcMain.on("window:toggle-maximize", () => {
      log("app:electron", "recv", "window toggle maximize");

      if (mainWindow.isMaximized()) {
         mainWindow.restore()
      } else {
         mainWindow.maximize()
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

   autoUpdater.on("download-progress", (e) => {
      log("app:electron", "updater", "download progress");

      mainWindow.webContents.send("update:progress", e);
   });

   ipcMain.handle("cli:get-args", () => {
      log("app:electron", "recv", "cli get args");

      return process.argv
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

   ipcMain.on("notification:send", (_, data: { title: string; body: string; payload?: string }) => {
      log("app:electron", "recv", "notification send", "title:", data.title, "body:", data.body, "pld:", data.payload);

      const notification = new Notification({
         title: data.title,
         body: data.body,
         icon: app.isPackaged ? path.join(process.resourcesPath, "assets", "icon.ico") : "./assets/icon.ico",
         silent: true,
      });

      notification.on("click", () => {
         log("app:electron", "send", "notification clicked", "pld:", data.payload);

         mainWindow.webContents.send("notification:clicked", data.payload);
      });

      notification.show();
   });

   const settingsPath = path.join(app.getPath("userData"), "settings.json");
   ipcMain.handle("settings:load", async () => {
      log("app:electron", "recv", "settings load");

      try {
         const fileContent = await readFile(settingsPath, { encoding: "utf-8" });
         return JSON.parse(fileContent);
      } catch (e) {
         console.log("Error reading settings file:", e);
         return {};
      }
   });

   ipcMain.handle("settings:save", async (_, settings: string) => {
      log("app:electron", "recv", "settings save");

      try {
         await writeFile(settingsPath, JSON.stringify(JSON.parse(settings), null, 2));
      } catch (e) {
         console.log("Error writing settings file:", e);
      }
   });

   ipcMain.handle("settings:try-save-default", async (_, settings: string) => {
      log("app:electron", "recv", "settings try save default");

      try {
         if (await fileExists(settingsPath)) {
            return;
         }

         await writeFile(settingsPath, JSON.stringify(JSON.parse(settings), null, 2));
      } catch (e) {
         console.log("Error writing settings file:", e);
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
         .map((x) => ({ thumbnail: x.thumbnail.toDataURL(), id: x.id, name: x.name, appIcon: x.appIcon?.toDataURL() }) as DisplaySource);
   });

   ipcMain.on("window:set-selected-display-source", (_, sourceId: string) => {
      log("app:electron", "recv", "window set selected display source", "sid:", sourceId);

      selectedSourceId = sourceId;
   });

   let processId: string | undefined;
   ipcMain.on("audio:start-loopback", async (_, processTitle: string) => {
      log("app:electron", "recv", "audio start loopback", "ptit:", processTitle);

      const processIds = await getActiveWindowProcessIds();

      processId = processIds.find(x => processTitle.includes(x.title))?.processId;
      if (processId) {
         log("app:electron", "loopback", "start", "pid:", processId);
         startAudioCapture(processId, {
            onData(data) {
               log("app:electron", "loopback-send", "d:", data)
               mainWindow.webContents.send("audio:loopback-data", data);
            },
         });
      }
   })

   ipcMain.on("audio:stop-loopback", () => {
      log("app:electron", "recv", "audio stop loopback", "pid:", processId);

      if (processId) {
         log("app:electron", "loopback", "stop", "pid:", processId);
         stopAudioCapture(processId);
      }
   })
}

async function fileExists(path: string) {
   try {
      await access(path);
      return true;
   } catch (_e) {
      return false;
   }
}
