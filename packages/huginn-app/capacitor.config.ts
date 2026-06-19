import "dotenv/config";
import type { CapacitorConfig } from "@capacitor/cli";

import { version } from "./package.json";

const config: CapacitorConfig = {
   appId: "dev.huginn",
   appName: "Huginn",
   webDir: "dist",
   plugins: {
      CapacitorUpdater: {
         autoUpdate: "off",
         allowModifyUrl: true,
         version: version,
      },
   },
   server: { cleartext: true, url: "http://localhost:5174" },
};

export default config;
