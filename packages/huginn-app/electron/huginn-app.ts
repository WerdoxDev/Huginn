import { analytics, analyticsShim, initAnalytics } from "@huginn/shared";
import { RuntimeAnalytics } from "@huginn/shared/runtime-analytics";
import { Tray, app, Menu, ipcMain, session } from "electron";
import updater from "electron-updater";
import path from "node:path";

import { ElectronStorage } from "../shared/electron-storage";
import { StorageController } from "../shared/storage-controller";
import { MainWindow } from "./main-window";

const { autoUpdater } = updater;

export class HuginnApp {
   private storage: StorageController<ElectronStorage>;
   private mainWindow?: MainWindow;
   private tray?: Tray;
   private allowedToRun: boolean;

   public constructor(allowedToRun: boolean) {
      this.allowedToRun = allowedToRun;
      this.storage = new StorageController(new ElectronStorage(app.isPackaged ? "" : "dev", analyticsShim));

      this.configureUpdater();
      this.registerEvents();

      app.on("ready", async () => await this.onReady());
      app.on("window-all-closed", () => this.handleAllWindowClosed());
      app.on("second-instance", (_e, argv) => this.handleSecondInstance(argv));
   }

   public static async create(allowedToRun: boolean) {
      const instance = new HuginnApp(allowedToRun);
      await instance.storage.mergeNewProperties();
      await instance.storage.setupClientInfo();
      await instance.initAnalytics();

      return instance;
   }

   private registerEvents() {
      this.registerCliEvents();
      this.registerAppEvents();
   }

   private async onReady() {
      if (!this.allowedToRun) {
         app.quit();
         return;
      }

      this.mainWindow = new MainWindow();
      this.createTray();

      // Setup as Startup App
      app.setLoginItemSettings({ openAtLogin: true, path: app.getPath("exe"), args: ["--silent"] });

      const settings = await this.storage.loadFile("settings");
      await this.applyProxySettings(settings.data.useProxy);
   }

   private handleAllWindowClosed() {
      if (process.platform !== "darwin") {
         app.quit();
      }
   }

   private handleSecondInstance(argv: string[]) {
      const cmd = argv.find((arg) => arg.startsWith("huginn://"));
      if (cmd) {
         this.mainWindow?.window.webContents.send("cli:deep-link", cmd);
      }

      this.mainWindow?.window.show();
      this.mainWindow?.window.focus();
   }

   async initAnalytics() {
      const { data: settings } = await this.storage.loadFile("settings");
      const { data: info } = await this.storage.loadFile("client-info");
      const posthogHostname = settings.hostnamePresets.find((x) => x.name === settings.activePresetName)?.posthogHostname;
      const otelHostname = settings.hostnamePresets.find((x) => x.name === settings.activePresetName)?.otelHostname;

      initAnalytics(
         new RuntimeAnalytics(process.env.VITE_PUBLIC_POSTHOG_KEY!, {
            serviceName: "app-electron",
            posthogHost: posthogHostname,
            otlpTraceUrl: `${otelHostname}/v1/traces`,
            otlpLogUrl: `${otelHostname}/v1/logs`,
            clientId: info.id,
         }),
      );

      this.storage.adapter.setAnalytics(analytics);
   }

   private configureUpdater() {
      autoUpdater.autoInstallOnAppQuit = false;
      autoUpdater.allowDowngrade = true;
      autoUpdater.autoDownload = false;

      autoUpdater.on("update-downloaded", () => {
         autoUpdater.quitAndInstall(true, true);
      });
   }

   private createTray() {
      const iconName = "tray.ico";
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

   public async applyProxySettings(useSystemProxy: boolean) {
      analytics.log({ body: "applying proxy settings", attributes: { use_proxy: useSystemProxy }, level: "info" });
      if (useSystemProxy) {
         await session.defaultSession.setProxy({ mode: "system" });
      } else {
         await session.defaultSession.setProxy({ mode: "direct" });
      }
      await session.defaultSession.closeAllConnections();
   }

   private registerCliEvents() {
      ipcMain.handle("cli:get-args", () => {
         return process.argv;
      });
   }

   private registerAppEvents() {
      ipcMain.handle("app:set-proxy", async (_, useSystemProxy: boolean) => {
         await this.applyProxySettings(useSystemProxy);
      });
   }
}
