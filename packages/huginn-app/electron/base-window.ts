import { log } from "@huginn/shared";
import { BrowserWindow, type BrowserWindowConstructorOptions } from "electron";
import path from "node:path";
import { pathToFileURL } from "node:url";

export abstract class BaseWindow {
   private readonly _window: BrowserWindow;
   private readonly name: string;

   public constructor(name: string, options: BrowserWindowConstructorOptions, startPath: string = "") {
      this.name = name;
      this._window = new BrowserWindow(options);
      const hashPath = startPath ? `/${startPath}` : "/";

      const baseUrl = process.env.VITE_DEV_SERVER_URL;
      if (baseUrl) {
         const url = `${baseUrl}/app${hashPath}`;

         log("app:electron", "default", `${this.name}`, "url:", url);
         this._window.loadURL(url);
      } else {
         const filePath = path.join(import.meta.dirname, "../dist/index.html");
         const url = `${pathToFileURL(filePath).toString()}/app${hashPath}`;

         log("app:electron", "default", `${this.name}`, "url:", url);
         this._window.loadURL(url);
      }

      this.eventListeners?.(this._window);
   }

   public eventListeners?(window: BrowserWindow): void;

   public get window() {
      return this._window;
   }
}
