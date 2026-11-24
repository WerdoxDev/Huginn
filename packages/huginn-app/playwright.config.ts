import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
   testDir: "./tests",
   testMatch: "web-smoke.spec.ts",
   fullyParallel: true,
   forbidOnly: Boolean(process.env.CI),
   retries: process.env.CI ? 2 : 0,
   reporter: [["list"], ["html", { open: "never", outputFolder: "playwright-report" }]],
   use: {
      baseURL: "http://127.0.0.1:4173",
      screenshot: "only-on-failure",
      trace: "on-first-retry",
   },
   projects: [
      {
         name: "chromium",
         use: { ...devices["Desktop Chrome"] },
      },
   ],
   webServer: {
      command: "pnpm exec vite preview --host 127.0.0.1 --port 4173",
      url: "http://127.0.0.1:4173/app/",
      reuseExistingServer: !process.env.CI,
   },
});
