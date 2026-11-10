import path from "node:path";

import { BaseWindow } from "./base-window";

export class OverlayWindow extends BaseWindow {
   public constructor(hostId: string, { offscreen = false }: { offscreen?: boolean } = {}) {
      super(
         "overlay",
         {
            width: 400,
            height: 300,
            resizable: offscreen,
            maximizable: false,
            minimizable: false,
            focusable: false,
            skipTaskbar: true,
            show: false,
            alwaysOnTop: !offscreen,
            backgroundColor: "#00000000",
            transparent: true,
            frame: false,
            webPreferences: {
               contextIsolation: true,
               offscreen,
               // The shared preload is an ES module, which requires an unsandboxed preload.
               sandbox: false,
               preload: path.join(import.meta.dirname, "preload.mjs"),
               backgroundThrottling: false,
            },
         },
         "overlay",
         { hostId },
      );

      if (!offscreen) this.window.setIgnoreMouseEvents(true);
   }
}
