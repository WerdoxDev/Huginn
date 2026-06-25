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
   server: process.env.VITE_DEV_SERVER_URL ? { cleartext: true, url: process.env.VITE_DEV_SERVER_URL } : undefined,
};

export default config;
