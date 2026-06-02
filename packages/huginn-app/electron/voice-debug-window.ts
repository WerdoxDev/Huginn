import path from "node:path";

import { BaseWindow } from "./base-window";

export class VoiceDebugWindow extends BaseWindow {
   public constructor() {
      super(
         "voice-debug",
         {
            width: 500,
            height: 600,
            frame: true,
            webPreferences: {
               contextIsolation: true,
               nodeIntegration: true,
               preload: path.join(import.meta.dirname, "preload.mjs"),
               backgroundThrottling: false,
            },
         },
         "voice-debug",
      );
   }
}
