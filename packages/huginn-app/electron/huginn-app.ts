import { analytics, analyticsShim, error, initAnalytics, log, type LogArgs } from "@huginn/shared";
import { RuntimeAnalytics } from "@huginn/shared/runtime-analytics";
import { Tray, app, Menu, ipcMain } from "electron";
import updater from "electron-updater";
import path from "node:path";

import { ElectronStorage } from "../shared/electron-storage";
import { RemoteLogger } from "../shared/remote-logger";
import { StorageController } from "../shared/storage-controller";
import { CacheController } from "./cache-controller";
import { MainWindow } from "./main-window";

const { autoUpdater } = updater;

export class HuginnApp {
   private storage: StorageController<ElectronStorage>;
   private cache: CacheController;
   private mainWindow?: MainWindow;
   private tray?: Tray;
   private allowedToRun: boolean;

   public constructor(allowedToRun: boolean) {
      this.allowedToRun = allowedToRun;
      this.storage = new StorageController(new ElectronStorage(app.isPackaged ? "" : "dev", analyticsShim));
      this.cache = new CacheController();
      this.configureUpdater();
      this.eventListeners();

      app.commandLine.appendSwitch("no-proxy-server");
      app.on("ready", () => this.onReady());
      app.on("window-all-closed", () => this.onAllWindowClosed());
      app.on("second-instance", (_e, argv) => this.onSecondInstance(argv));
   }

   async initAsync() {
      // await this.storage.checkFiles();
      await this.storage.adapter.tryMigrate();
      await this.storage.setupClientInfo();
      await this.initAnalytics();
   }

   private eventListeners() {
      this.cliCategoryEvents();
   }

   private onReady() {
      log("app:electron", "recv", "app ready");

      if (!this.allowedToRun) {
         app.quit();
         return;
      }

      this.mainWindow = new MainWindow(this.cache);
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
      log("app:electron", "recv", "second instance", "args:", argv);

      const cmd = argv.find((arg) => arg.startsWith("huginn://"));
      if (cmd) {
         log("app:electron", "send", "cli deep link", "cmd:", cmd);
         this.mainWindow?.window.webContents.send("cli:deep-link", cmd);
      }

      this.mainWindow?.window.show();
      this.mainWindow?.window.focus();
   }

   async initAnalytics() {
      try {
         // const content = await fs.readFile(this.storage.adapter.getFilePath("client-info"), "utf-8");
         const { data: settings } = await this.storage.loadFile("settings");
         const { data: info } = await this.storage.loadFile("client-info");
         const analyticsHostname = settings.hostnamePresets.find((x) => x.name === settings.activePresetName)?.analyticsHostname;

         initAnalytics(
            new RuntimeAnalytics(process.env.VITE_PUBLIC_POSTHOG_KEY!, {
               serviceName: "app-electron",
               posthogHost: analyticsHostname ?? "",
               otlpHost: process.env.VITE_PUBLIC_OTEL_HOST,
               clientId: info.id,
               // host: apiHostname,
            }),
         );

         this.storage.adapter.setAnalytics(analytics);
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
         log("app:electron", "updater", "cancelled");
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
      this.tray = new Tray(
         app.isPackaged ? path.join(process.resourcesPath, "electron-assets", iconName) : path.join(__dirname, "../", "electron-assets", iconName),
      );
      const contextMenu = Menu.buildFromTemplate([
         {
            label: "Quit",
            type: "normal",
            click: () => {
               app.exit();
            },
         },
      ]);

      this.tray.setContextMenu(contextMenu);
      this.tray.setToolTip("Huginn");

      this.tray.on("click", () => {
         this.mainWindow?.window.show();
      });
   }

   private cliCategoryEvents() {
      ipcMain.handle("cli:get-args", () => {
         log("app:electron", "recv", "cli get args");

         return process.argv;
      });
   }
}
