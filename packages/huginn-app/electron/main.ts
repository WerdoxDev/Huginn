import path from "node:path";
import { error, log, logger, type LogArgs } from "@huginn/shared";
import { setExecutablesRoot } from "application-loopback";
import { app, ipcMain, Menu, Tray } from "electron";
import updater from "electron-updater";
import { RemoteLogger } from "../shared/remote-logger";
import { randomUUID } from "node:crypto";
import { MainWindow } from "./main-window";
import { FileController } from "./file-controller";
import { CacheController } from "./cache-controller";

const { autoUpdater } = updater;

let allowedToRun: boolean;
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

   allowedToRun = app.requestSingleInstanceLock() || !app.isPackaged;

   if (!allowedToRun) {
      log("app:electron", "default", "exit because of lock");

      app.exit();
   }
} catch (e) {
   error("app:electron", "Default protocol registration or single instance lock failed:", e);
}

// application-loopback executable path when packaged
if (app.isPackaged) {
   setExecutablesRoot(path.resolve(import.meta.dirname, "..", "..", "app.asar.unpacked", "node_modules", "application-loopback", "bin"));
}

class HuginnApp {
   private fileController: FileController;
   private cacheController: CacheController;
   private mainWindow?: MainWindow;
   private remoteLogger?: RemoteLogger;

   public constructor() {
      this.fileController = new FileController(app.isPackaged ? "" : "dev");
      this.cacheController = new CacheController();
      this.configureUpdater();
      this.eventListeners();

      app.commandLine.appendSwitch("no-proxy-server");
      app.on("ready", () => this.onReady());
      app.on("window-all-closed", () => this.onAllWindowClosed());
      app.on("second-instance", (_e, argv) => this.onSecondInstance(argv));
   }

   async initAsync() {
      await this.fileController.tryMigrate();
      await this.setupClientInfo();
      await this.initializeLogger();
   }

   private eventListeners() {
      this.loggerCategoryEvents();
      this.cliCategoryEvents();
   }

   private onReady() {
      log("app:electron", "recv", "app ready");

      if (!allowedToRun) {
         return;
      }

      this.mainWindow = new MainWindow(this.cacheController);
      this.configureTray();

      // Setup as Startup App
      log("app:electron", "default", "set startup");
      app.setLoginItemSettings({ openAtLogin: true, path: app.getPath("exe"), args: ["--silent"] });
   }

   private onAllWindowClosed() {
      log("app:electron", "recv", "app all windows closed");

      if (process.platform !== "darwin") {
         app.quit();
      }
   }

   private onSecondInstance(argv: string[]) {
      const cmd = argv.pop();

      log("app:electron", "recv", "second instance", "cmd:", cmd);

      if (cmd?.startsWith("huginn://")) {
         log("app:electron", "send", "cli deep link", "cmd:", cmd);
         this.mainWindow?.window.webContents.send("cli:deep-link", cmd);
      }

      this.mainWindow?.window.show();
      this.mainWindow?.window.focus();
   }

   async setupClientInfo() {
      try {
         const value = await this.fileController.loadFile("client-info");
         if (value.created || !value.data.id) {
            value.data.id = randomUUID();
            await this.fileController.saveFile("client-info", value.data);
         }
      } catch (e) {
         error("app:electron", "client info setup failed:", e);
      }
   }

   async initializeLogger() {
      try {
         const {
            data: { apiHostname },
         } = await this.fileController.loadFile("settings");

         const { data: info } = await this.fileController.loadFile("client-info");
         const endpoint = new URL("/api/log", apiHostname).toString();
         logger.enableLogs({ "app:electron": ["default", "loopback", "recv", "send", "updater", "file-controller"] });
         this.remoteLogger = new RemoteLogger(logger, endpoint, info.id);
      } catch (e) {
         error("app:electron", "logger setup failed:", e);
      }
   }

   private configureUpdater() {
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
   }

   private configureTray() {
      log("app:electron", "default", "configure tray");

      const iconName = "icon.ico";
      const tray = new Tray(app.isPackaged ? path.join(process.resourcesPath, "electron-assets", iconName) : `./electron-assets/${iconName}`);
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
         this.mainWindow?.window.show();
      });
   }

   private loggerCategoryEvents() {
      ipcMain.on("logger:add-to-buffer", (_, type: "log" | "error", section: string, level: string | undefined, ...args: LogArgs[]) => {
         this.remoteLogger?.addToBuffer(type, section, level, ...args);
      });
   }

   private cliCategoryEvents() {
      ipcMain.handle("cli:get-args", () => {
         log("app:electron", "recv", "cli get args");

         return process.argv;
      });
   }
}

const huginn = new HuginnApp();
await huginn.initAsync();
