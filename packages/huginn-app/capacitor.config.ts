import "dotenv/config";
import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
   appId: "dev.huginn",
   appName: "Huginn",
   webDir: "dist",
   plugins: {
      Media: {
         androidGalleryMode: true,
      },
   },
   server: { cleartext: true, url: "http://localhost:5174" },
};

export default config;
