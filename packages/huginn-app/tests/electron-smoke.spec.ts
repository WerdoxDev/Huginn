import { chromium, expect, test, type Browser } from "@playwright/test";
import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const electronExecutable = require("electron") as string;
const appDirectory = fileURLToPath(new URL("..", import.meta.url));

test("desktop app opens and renders its bundled webview", async () => {
   const userDataDirectory = test.info().outputPath("user-data");
   const electronProcess = spawn(
      electronExecutable,
      ["--remote-debugging-port=0", "--no-sandbox", `--user-data-dir=${userDataDirectory}`, appDirectory],
      {
         cwd: appDirectory,
         env: {
            ...process.env,
            ELECTRON_DISABLE_SECURITY_WARNINGS: "true",
            VITE_DEV_SERVER_URL: "",
            ...(process.platform === "linux" ? { HYPRLAND_INSTANCE_SIGNATURE: "smoke-test" } : {}),
         },
         stdio: ["ignore", "pipe", "pipe"],
      },
   );

   let processOutput = "";
   electronProcess.stdout.on("data", (chunk) => {
      processOutput += chunk.toString();
   });

   const devtoolsEndpoint = new Promise<string>((resolve, reject) => {
      electronProcess.stderr.on("data", (chunk) => {
         const text = chunk.toString();
         processOutput += text;

         const match = text.match(/DevTools listening on (ws:\/\/\S+)/);
         if (match) resolve(match[1]);
      });

      electronProcess.once("exit", (code) => {
         reject(new Error(`Electron exited with code ${code}.\n${processOutput}`));
      });
   });

   let endpointTimeoutId: ReturnType<typeof setTimeout> | undefined;
   const endpointTimeout = new Promise<never>((_, reject) => {
      endpointTimeoutId = setTimeout(() => {
         reject(new Error(`Electron did not expose DevTools within 15 seconds.\n${processOutput}`));
      }, 15_000);
   });

   let browser: Browser | undefined;

   try {
      const endpoint = await Promise.race([devtoolsEndpoint, endpointTimeout]);
      if (endpointTimeoutId) clearTimeout(endpointTimeoutId);

      browser = await chromium.connectOverCDP(endpoint);
      const context = browser.contexts()[0];

      await expect.poll(() => context.pages().length).toBeGreaterThan(0);
      const window = context.pages()[0];
      const pageErrors: Error[] = [];
      window.on("pageerror", (error) => pageErrors.push(error));

      await window.waitForLoadState("domcontentloaded");
      await expect(window).toHaveURL(/^file:/);
      await expect(window).toHaveTitle(/Huginn/i);
      await expect(window.locator("#root")).not.toBeEmpty();

      const platform = await window.evaluate(async () => (await window.electronAPI.getOsInfo()).platform);
      expect(platform).toBe(process.platform);
      expect(pageErrors).toEqual([]);
   } finally {
      if (endpointTimeoutId) clearTimeout(endpointTimeoutId);
      await browser?.close();
      if (electronProcess.exitCode === null) electronProcess.kill();
   }
});
