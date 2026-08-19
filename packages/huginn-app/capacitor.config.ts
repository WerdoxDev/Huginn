import "dotenv/config";
import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
   appId: "dev.huginn",
   appName: "Huginn",
   webDir: "dist",
   plugins: {
      LiveUpdate: { publicKey: process.env.CAPAWESOME_PUBLIC_KEY, readyTimeout: 10000 },
   },
   server: process.env.VITE_DEV_SERVER_URL ? { cleartext: true, url: process.env.VITE_DEV_SERVER_URL } : undefined,
};

export default config;
