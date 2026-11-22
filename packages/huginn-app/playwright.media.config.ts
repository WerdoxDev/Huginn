import { defineConfig, devices } from "@playwright/test";

import config from "./playwright.config";

export default defineConfig({
   ...config,
   testMatch: "media-viewer.spec.ts",
   projects: [
      { name: "desktop", use: { ...devices["Desktop Chrome"] } },
      { name: "mobile", use: { ...devices["Pixel 7"] } },
   ],
   webServer: {
      command: "pnpm exec vite --host 127.0.0.1 --port 4174 --strictPort",
      url: "http://127.0.0.1:4174/app/tests/fixtures/media-viewer.html",
      reuseExistingServer: !process.env.CI,
   },
   use: { ...config.use, baseURL: "http://127.0.0.1:4174" },
});
