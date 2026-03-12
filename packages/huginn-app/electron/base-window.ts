import { log } from "@huginn/shared";
import { BrowserWindow, type BrowserWindowConstructorOptions } from "electron";
import path from "node:path";

export abstract class BaseWindow {
   private readonly _window: BrowserWindow;
   private readonly name: string;

   public constructor(name: string, options: BrowserWindowConstructorOptions, startPath: string = "") {
      this.name = name;
      this._window = new BrowserWindow(options);

      const baseUrl = process.env.VITE_DEV_SERVER_URL;
      if (baseUrl) {
         const url = `${baseUrl}/#/${startPath}`;

         log("app:electron", "default", `${this.name}`, "url:", url);
         this._window.loadURL(url);
      } else {
         const filePath = path.join(import.meta.dirname, "../dist/index.html");

         log("app:electron", "default", `${this.name}`, "url:", `${filePath}/#/${startPath}`);
         this._window.loadFile(filePath, { hash: startPath });
      }

      this.eventListeners?.(this._window);
   }

   public eventListeners?(window: BrowserWindow): void;

   public get window() {
      return this._window;
   }
}
