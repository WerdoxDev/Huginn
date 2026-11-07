import path from "node:path";

import { BaseWindow } from "./base-window";

export class OverlayWindow extends BaseWindow {
   public constructor(hostId: string) {
      super(
         "overlay",
         {
            width: 400,
            height: 300,
            resizable: false,
            maximizable: false,
            minimizable: false,
            focusable: false,
            skipTaskbar: true,
            show: false,
            alwaysOnTop: true,
            transparent: true,
            frame: false,
            webPreferences: {
               contextIsolation: true,
               // The shared preload is an ES module, which requires an unsandboxed preload.
               sandbox: false,
               preload: path.join(import.meta.dirname, "preload.mjs"),
               backgroundThrottling: false,
            },
         },
         "overlay",
         { hostId },
      );

      this.window.setIgnoreMouseEvents(true);
   }
}
