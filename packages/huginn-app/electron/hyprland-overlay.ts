import type { NativeImage } from "electron";

import log from "electron-log";
import native from "native-addon";
import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process";

import { HyprlandOverlayTransport } from "./hyprland-overlay-transport";
import { HyprlandWindowTracker, type OverlayGeometry } from "./hyprland-window-tracker";
import { OverlayWindow } from "./overlay-window";

export class HyprlandOverlay {
   readonly window;
   private child?: ChildProcessWithoutNullStreams;
   private transport?: HyprlandOverlayTransport;
   private tracker: HyprlandWindowTracker;
   private disposed = false;
   private geometry?: OverlayGeometry;

   constructor(hostId: string, address: string) {
      this.tracker = new HyprlandWindowTracker(address, {
         update: (geometry) => this.update(geometry),
         closed: () => this.window.close(),
         error: (error) => this.fail(error),
      });
      this.window = new OverlayWindow(hostId, { offscreen: true }).window;
      this.window.webContents.setFrameRate(30);
      this.window.webContents.stopPainting();
      this.window.webContents.on("paint", (_event, _dirty, image: NativeImage) => {
         // Chromium can emit an empty paint while an offscreen view is resizing.
         if (this.disposed || !this.geometry || image.isEmpty()) return;
         try {
            const { width, height } = image.getSize();
            this.transport?.paint(width, height, image.toBitmap());
         } catch (error) {
            this.fail(error instanceof Error ? error : new Error(String(error)));
         }
      });
      this.window.webContents.on("render-process-gone", (_event, details) => this.fail(new Error(`Overlay renderer exited: ${details.reason}`)));
      this.window.once("closed", () => this.dispose());
   }

   async start() {
      if (this.disposed) return;
      const child = (this.child = spawn(native.getHyprlandOverlayHelperPath(), [], { stdio: "pipe" }));
      this.transport = new HyprlandOverlayTransport(child.stdin);
      child.stdin.on("error", (error) => this.fail(error));
      let stderr = "";
      child.stderr.on("data", (data: Buffer) => {
         stderr = (stderr + data.toString()).slice(-4096);
      });
      await new Promise<void>((resolve, reject) => {
         const timeout = setTimeout(() => {
            reject(new Error("Hyprland overlay helper startup timed out"));
            this.dispose();
         }, 3000);
         let ready = "";
         child.stdout.on("data", (data: Buffer) => {
            ready = (ready + data.toString()).slice(-128);
            if (ready.includes("ready\n")) {
               clearTimeout(timeout);
               resolve();
            }
         });
         child.once("error", (error) => {
            clearTimeout(timeout);
            reject(error);
            this.fail(error);
         });
         child.once("exit", (code, signal) => {
            clearTimeout(timeout);
            const error = new Error(`Hyprland overlay helper exited (${signal ?? code})${stderr ? `: ${stderr.trim()}` : ""}`);
            reject(error);
            this.fail(error);
         });
      });
      if (!this.disposed) await this.tracker.start();
   }

   private update(geometry: OverlayGeometry | undefined) {
      if (this.disposed) return;
      this.geometry = geometry;
      if (!geometry) {
         this.window.webContents.stopPainting();
         this.transport?.hide();
         return;
      }
      this.window.setSize(geometry.width, geometry.height);
      this.transport?.configure(geometry);
      this.window.webContents.startPainting();
      this.window.webContents.invalidate();
   }

   private fail(error: Error) {
      if (this.disposed) return;
      log.error("Hyprland overlay failed", error);
      if (!this.window.isDestroyed()) this.window.close();
      this.dispose();
   }

   private dispose() {
      if (this.disposed) return;
      this.disposed = true;
      this.tracker.stop();
      this.transport?.close();
      this.child?.stdin.destroy();
      this.child?.kill();
   }
}
