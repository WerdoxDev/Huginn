import "dotenv/config";
import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
   appId: "dev.huginn",
   appName: "Huginn",
   webDir: "dist",
   // server: { cleartext: true, url: "http://192.168.178.21:5174" },
};

export default config;
