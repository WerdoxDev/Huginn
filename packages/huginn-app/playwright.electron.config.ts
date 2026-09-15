import { defineConfig } from "@playwright/test";

export default defineConfig({
   testDir: "./tests",
   testMatch: "electron-smoke.spec.ts",
   forbidOnly: Boolean(process.env.CI),
   retries: process.env.CI ? 1 : 0,
   timeout: 60_000,
   reporter: [["list"], ["html", { open: "never", outputFolder: "playwright-report" }]],
   use: {
      screenshot: "only-on-failure",
      trace: "on-first-retry",
   },
});
