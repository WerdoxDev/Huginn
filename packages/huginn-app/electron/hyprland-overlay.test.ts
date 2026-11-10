/// <reference types="bun" />

import { beforeEach, expect, mock, test } from "bun:test";
import { EventEmitter } from "node:events";
import { PassThrough } from "node:stream";

class FakeWebContents extends EventEmitter {
   setFrameRate = mock();
   startPainting = mock();
   stopPainting = mock();
   invalidate = mock();
}

class FakeWindow extends EventEmitter {
   webContents = new FakeWebContents();
   setSize = mock();
   destroyed = false;
   loadURL() {}
   loadFile() {}
   isDestroyed() {
      return this.destroyed;
   }
   close() {
      if (this.destroyed) return;
      this.destroyed = true;
      this.emit("closed");
   }
   constructor(options: unknown) {
      super();
      createWindow(options);
   }
}

class FakeChild extends EventEmitter {
   stdin = new PassThrough();
   stdout = new PassThrough();
   stderr = new PassThrough();
   packets: Buffer[] = [];
   kill = mock(() => {
      this.emit("exit", null, "SIGTERM");
      return true;
   });
   constructor() {
      super();
      this.stdin.on("data", (packet: Buffer) => this.packets.push(packet));
   }
}

let child: FakeChild;
let callbacks: { update: (geometry: unknown) => void; closed: () => void; error: (error: Error) => void };
const createWindow = mock();
const startTracking = mock(async () => {});
const stopTracking = mock();

mock.module("electron", () => ({ BrowserWindow: FakeWindow }));
mock.module("electron-log", () => ({ default: { error: mock() } }));
mock.module("native-addon", () => ({ default: { getHyprlandOverlayHelperPath: () => "/native/huginn-hyprland-overlay" } }));
mock.module("node:child_process", () => ({ spawn: () => child }));
mock.module("./hyprland-window-tracker", () => ({
   HyprlandWindowTracker: class {
      start = startTracking;
      stop = stopTracking;
      constructor(_address: string, input: typeof callbacks) {
         callbacks = input;
      }
   },
}));

const { HyprlandOverlay } = await import("./hyprland-overlay");

beforeEach(() => {
   child = new FakeChild();
   createWindow.mockClear();
   startTracking.mockClear();
   stopTracking.mockClear();
});

async function startOverlay() {
   const overlay = new HyprlandOverlay("voice-host", "0xabc");
   const started = overlay.start();
   child.stdout.write("ready\n");
   await started;
   return overlay;
}

test("renders the existing overlay page offscreen and sends its frames to the native helper", async () => {
   const overlay = await startOverlay();
   expect(createWindow).toHaveBeenCalledWith(
      expect.objectContaining({ transparent: true, show: false, webPreferences: expect.objectContaining({ offscreen: true }) }),
   );
   expect(overlay.window.webContents.setFrameRate).toHaveBeenCalledWith(30);
   callbacks.update({ output: "DP-1", x: 10, y: 20, width: 2, height: 1 });
   expect(overlay.window.setSize).toHaveBeenCalledWith(2, 1);
   overlay.window.webContents.emit(
      "paint",
      {},
      {},
      { isEmpty: () => false, getSize: () => ({ width: 2, height: 1 }), toBitmap: () => Buffer.alloc(8, 128) },
   );
   expect(child.packets.map((packet) => packet.readUInt32LE(0))).toEqual([1, 2]);
   callbacks.update(undefined);
   expect(child.packets[2].readUInt32LE(0)).toBe(3);
   expect(overlay.window.webContents.stopPainting).toHaveBeenCalledTimes(2);
   callbacks.closed();
   expect(overlay.window.isDestroyed()).toBe(true);
   expect(child.kill).toHaveBeenCalledOnce();
   expect(stopTracking).toHaveBeenCalledOnce();
});

test("ignores transient empty Chromium paints while resizing", async () => {
   const overlay = await startOverlay();
   callbacks.update({ output: "DP-1", x: 0, y: 0, width: 2, height: 1 });
   overlay.window.webContents.emit("paint", {}, {}, { isEmpty: () => true });
   expect(child.packets).toHaveLength(1);
   expect(overlay.window.isDestroyed()).toBe(false);
   overlay.window.close();
});

test("cleans up the renderer and tracker when the helper cannot start", async () => {
   const overlay = new HyprlandOverlay("voice-host", "0xabc");
   const started = overlay.start();
   child.emit("error", new Error("missing helper"));
   await expect(started).rejects.toThrow("missing helper");
   expect(overlay.window.isDestroyed()).toBe(true);
   expect(startTracking).not.toHaveBeenCalled();
   expect(stopTracking).toHaveBeenCalledOnce();
});

test("closing during helper startup cancels tracking and releases the child", async () => {
   const overlay = new HyprlandOverlay("voice-host", "0xabc");
   const started = overlay.start();
   overlay.window.close();
   await expect(started).rejects.toThrow("helper exited");
   expect(startTracking).not.toHaveBeenCalled();
   expect(child.kill).toHaveBeenCalledOnce();
});

test("removes the native surface if the web renderer crashes", async () => {
   const overlay = await startOverlay();
   overlay.window.webContents.emit("render-process-gone", {}, { reason: "crashed" });
   expect(overlay.window.isDestroyed()).toBe(true);
   expect(child.kill).toHaveBeenCalledOnce();
   expect(stopTracking).toHaveBeenCalledOnce();
});
