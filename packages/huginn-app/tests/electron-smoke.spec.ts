import { chromium, expect, test, type Browser } from "@playwright/test";
import { spawn, type ChildProcess } from "node:child_process";
import { cp, mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const packagedDirectory = fileURLToPath(new URL(`../dist/electron/${process.platform === "win32" ? "win" : "linux"}-unpacked`, import.meta.url));

test("packaged desktop app opens and renders its bundled webview", async () => {
   const temporaryDirectory = await mkdtemp(path.join(tmpdir(), "huginn-electron-smoke-"));
   const appDirectory = path.join(temporaryDirectory, "app");
   let electronProcess: ChildProcess | undefined;
   let processClosed: Promise<void> | undefined;
   let processOutput = "";
   let endpointTimeoutId: ReturnType<typeof setTimeout> | undefined;
   let browser: Browser | undefined;

   try {
      // Keep the executable and cwd outside the checkout so missing dependencies
      // cannot resolve through the workspace's node_modules.
      await cp(packagedDirectory, appDirectory, { recursive: true });
      const electronExecutable = path.join(appDirectory, process.platform === "win32" ? "Huginn.exe" : "huginn-app-react");
      const env: NodeJS.ProcessEnv = {
         ...process.env,
         ELECTRON_DISABLE_SECURITY_WARNINGS: "true",
         VITE_DEV_SERVER_URL: "",
         XDG_CONFIG_HOME: path.join(temporaryDirectory, "config"),
         ...(process.platform === "linux" ? { HYPRLAND_INSTANCE_SIGNATURE: "smoke-test" } : {}),
      };
      delete env.NODE_PATH;
      delete env.NODE_OPTIONS;
      delete env.ELECTRON_RUN_AS_NODE;

      electronProcess = spawn(
         electronExecutable,
         ["--remote-debugging-port=0", "--no-sandbox", `--user-data-dir=${path.join(temporaryDirectory, "user-data")}`],
         {
            cwd: appDirectory,
            env,
            stdio: ["ignore", "pipe", "pipe"],
         },
      );
      processClosed = new Promise((resolve) => electronProcess!.once("close", () => resolve()));
      electronProcess.stdout!.on("data", (chunk) => {
         processOutput += chunk.toString();
      });

      const devtoolsEndpoint = new Promise<string>((resolve) => {
         electronProcess!.stderr!.on("data", (chunk) => {
            const text = chunk.toString();
            processOutput += text;

            const match = processOutput.match(/DevTools listening on (ws:\/\/\S+)/);
            if (match) resolve(match[1]);
         });
      });
      const processFailed = new Promise<never>((_, reject) => {
         electronProcess!.once("error", reject);
         electronProcess!.once("exit", (code, signal) => reject(new Error(`Packaged Electron exited with code ${code}, signal ${signal}.`)));
      });
      const endpointTimeout = new Promise<never>((_, reject) => {
         endpointTimeoutId = setTimeout(() => reject(new Error("Packaged Electron did not expose DevTools within 15 seconds.")), 15_000);
      });

      await Promise.race([
         processFailed,
         (async () => {
            const endpoint = await Promise.race([devtoolsEndpoint, endpointTimeout]);
            clearTimeout(endpointTimeoutId);

            browser = await chromium.connectOverCDP(endpoint);
            const context = browser.contexts()[0];

            await expect.poll(() => context.pages().length).toBeGreaterThan(0);
            const window = context.pages()[0];
            const pageErrors: Error[] = [];
            window.on("pageerror", (error) => pageErrors.push(error));

            await window.waitForLoadState("domcontentloaded");
            await expect(window).toHaveURL(/^file:.*\/resources\/app\.asar\/dist\/index\.html/);
            await expect(window).toHaveTitle(/Huginn/i);
            await expect(window.locator("#root")).not.toBeEmpty();

            const platform = await window.evaluate(async () => (await window.electronAPI.getOsInfo()).platform);
            expect(platform).toBe(process.platform);
            expect(pageErrors).toEqual([]);
         })(),
      ]);
   } catch (error) {
      throw new Error(`${error instanceof Error ? error.message : String(error)}\n${processOutput}`, { cause: error });
   } finally {
      if (endpointTimeoutId) clearTimeout(endpointTimeoutId);
      await browser?.close().catch(() => {});
      if (electronProcess?.exitCode === null && electronProcess.signalCode === null) electronProcess.kill();
      await processClosed;
      await rm(temporaryDirectory, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
      await test.info().attach("electron-output", { body: processOutput, contentType: "text/plain" });
   }
});
