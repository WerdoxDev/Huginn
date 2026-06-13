import "dotenv/config";
import type { CapacitorConfig } from "@capacitor/cli";

import { KeyboardResize } from "@capacitor/keyboard";

const config: CapacitorConfig = {
   appId: "dev.huginn",
   appName: "Huginn",
   webDir: "dist",
   plugins: {
      Keyboard: {
         resize: KeyboardResize.None,
      },
   },
   // server: { cleartext: true, url: "http://192.168.178.21:5174" },
};

export default config;
