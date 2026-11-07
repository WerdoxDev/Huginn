/// <reference types="bun" />

import { beforeEach, describe, expect, mock, test } from "bun:test";
import { EventEmitter } from "node:events";

class FakeWindow extends EventEmitter {
   destroyed = false;
   setBounds = mock();
   setAlwaysOnTop = mock();
   visible = false;
   showInactive = mock(() => {
      this.visible = true;
   });
   hide = mock(() => {
      this.visible = false;
   });
   moveTop = mock();
   isDestroyed() {
      return this.destroyed;
   }
   close() {
      this.destroyed = true;
      this.emit("closed");
   }
}

type Subscription = {
   hwnd: number;
   kind: "bounds" | "close" | "focus";
   callback: (...args: any[]) => void;
   active: boolean;
   stop: ReturnType<typeof mock>;
};

let openOverlay: (event: unknown, input: { hwnd: number; hostId: string }) => Promise<void>;
let subscriptions: Subscription[] = [];
let registrationError: Error | undefined;
const createOverlay = mock();
const rect = { x: 100, y: 100, width: 640, height: 480 };

function subscribe(kind: Subscription["kind"], hwnd: number, callback: Subscription["callback"]) {
   const subscription: Subscription = { hwnd, kind, callback, active: true, stop: mock() };
   subscription.stop = mock(() => {
      subscription.active = false;
   });
   subscriptions.push(subscription);
   return subscription.stop;
}

function notifyClose(hwnd: number) {
   for (const subscription of subscriptions) {
      if (subscription.hwnd === hwnd && subscription.kind === "close" && subscription.active) {
         subscription.callback();
      }
   }
}

mock.module("electron", () => ({
   app: {},
   BrowserWindow: FakeWindow,
   nativeImage: {},
   session: {},
   shell: {},
   screen: { screenToDipRect: (_window: unknown, bounds: unknown) => bounds },
   ipcMain: {
      on: (channel: string, callback: typeof openOverlay) => {
         if (channel === "overlay:open") openOverlay = callback;
      },
   },
}));
mock.module("@huginnjs/shared", () => ({ analytics: { startActiveSpan: (_name: string, callback: () => unknown) => callback() } }));
mock.module("electron-log", () => ({ default: {} }));
mock.module("electron-updater", () => ({ default: { autoUpdater: {} }, CancellationToken: class {} }));
mock.module("loopback-capture", () => ({ default: {} }));
mock.module("native-addon", () => ({
   default: {
      getOpenApplications: async () => [
         { hwnd: 1, rect },
         { hwnd: 2, rect },
      ],
      listenToWindowBounds: (hwnd: number, callback: Subscription["callback"]) => subscribe("bounds", hwnd, callback),
      listenToWindowFocus: (hwnd: number, callback: Subscription["callback"]) => subscribe("focus", hwnd, callback),
      listenToWindowClose: (hwnd: number, callback: Subscription["callback"]) => {
         if (registrationError) throw registrationError;
         return subscribe("close", hwnd, callback);
      },
   },
}));
mock.module("./keybinds-controller", () => ({ registerEvents: mock() }));
mock.module("./notification-controller", () => ({ NotificationController: class {} }));
mock.module("./screen-manager", () => ({ ScreenManager: class {} }));
mock.module("./utils", () => ({ isLinux: false, isWindows: true }));
mock.module("./websocket", () => ({ ElectronWebSocket: class {} }));
mock.module("./overlay-window", () => ({
   OverlayWindow: class {
      window = new FakeWindow();
      constructor(hostId: string) {
         createOverlay(hostId);
      }
   },
}));

const { MainWindow } = await import("./main-window");

type TestMainWindow = {
   _window: FakeWindow;
   overlayWindow?: { window: FakeWindow };
   registerOverlayEvents(): void;
};
let main: TestMainWindow;

beforeEach(() => {
   subscriptions = [];
   registrationError = undefined;
   createOverlay.mockClear();
   // Exercise the real overlay handlers without starting unrelated Electron services.
   main = Object.create(MainWindow.prototype) as TestMainWindow;
   main._window = new FakeWindow();
   main.registerOverlayEvents();
});

describe("overlay window lifecycle", () => {
   function notifyFocus(hwnd: number, focused: boolean) {
      for (const subscription of subscriptions) {
         if (subscription.hwnd === hwnd && subscription.kind === "focus" && subscription.active) subscription.callback(focused);
      }
   }

   test("hides on blur and shows without stealing focus on focus gain", async () => {
      await openOverlay(null, { hwnd: 1, hostId: "voice-host" });
      const overlay = main.overlayWindow!.window;
      expect(createOverlay).toHaveBeenCalledTimes(1);
      expect(createOverlay).toHaveBeenCalledWith("voice-host");
      expect(overlay.visible).toBe(false);
      notifyFocus(1, true);
      expect(overlay.visible).toBe(true);
      expect(overlay.moveTop).toHaveBeenCalled();
      notifyFocus(1, false);
      expect(overlay.visible).toBe(false);
      expect(overlay.isDestroyed()).toBe(false);
      notifyFocus(1, true);
      expect(overlay.visible).toBe(true);
      expect(overlay.showInactive).toHaveBeenCalledTimes(2);
   });

   test("bounds updates while unfocused stay hidden and are used on focus gain", async () => {
      await openOverlay(null, { hwnd: 1, hostId: "voice-host" });
      const overlay = main.overlayWindow!.window;
      notifyFocus(1, true);
      notifyFocus(1, false);
      const moved = { x: 300, y: 300, width: 800, height: 600 };
      const boundsListener = subscriptions.find((subscription) => subscription.kind === "bounds")!;
      boundsListener.callback(moved);
      expect(overlay.setBounds).toHaveBeenLastCalledWith(moved, true);
      expect(overlay.visible).toBe(false);
      expect(overlay.showInactive).toHaveBeenCalledTimes(1);
      notifyFocus(1, true);
      expect(overlay.visible).toBe(true);
      expect(overlay.setBounds).toHaveBeenLastCalledWith(moved, true);
   });

   test("retargeting hides the overlay until the new target gains focus", async () => {
      await openOverlay(null, { hwnd: 1, hostId: "voice-host" });
      const overlay = main.overlayWindow!.window;
      notifyFocus(1, true);
      expect(overlay.visible).toBe(true);
      await openOverlay(null, { hwnd: 2, hostId: "voice-host" });
      expect(overlay.visible).toBe(false);
      notifyFocus(1, true);
      expect(overlay.visible).toBe(false);
      notifyFocus(2, false);
      expect(overlay.visible).toBe(false);
      notifyFocus(2, true);
      expect(overlay.visible).toBe(true);
   });

   test("closes the overlay and removes all listeners when its HWND closes", async () => {
      await openOverlay(null, { hwnd: 1, hostId: "voice-host" });
      const overlay = main.overlayWindow!.window;
      expect(overlay.setBounds).toHaveBeenCalledWith(rect, true);
      notifyClose(1);
      expect(overlay.isDestroyed()).toBe(true);
      expect(main.overlayWindow).toBeUndefined();
      expect(subscriptions.every((subscription) => !subscription.active)).toBe(true);
   });

   test("removes old listeners on retarget and ignores the old HWND closing", async () => {
      await openOverlay(null, { hwnd: 1, hostId: "voice-host" });
      const overlay = main.overlayWindow!.window;
      await openOverlay(null, { hwnd: 2, hostId: "voice-host" });
      expect(subscriptions.filter((subscription) => subscription.active).map((subscription) => subscription.hwnd)).toEqual([2, 2, 2]);
      notifyClose(1);
      expect(overlay.isDestroyed()).toBe(false);
      notifyClose(2);
      expect(overlay.isDestroyed()).toBe(true);
   });

   test("removes listeners on manual overlay closure and can create another overlay", async () => {
      await openOverlay(null, { hwnd: 1, hostId: "voice-host" });
      const overlay = main.overlayWindow!.window;
      overlay.close();
      expect(main.overlayWindow).toBeUndefined();
      expect(subscriptions.every((subscription) => !subscription.active)).toBe(true);
      await openOverlay(null, { hwnd: 2, hostId: "voice-host" });
      expect(main.overlayWindow!.window).not.toBe(overlay);
      expect(main.overlayWindow!.window.isDestroyed()).toBe(false);
   });

   test("cleans up the overlay and bounds listener if close registration fails", async () => {
      registrationError = new Error("Window closed during registration");
      await expect(openOverlay(null, { hwnd: 1, hostId: "voice-host" })).rejects.toThrow(registrationError.message);
      expect(main.overlayWindow).toBeUndefined();
      expect(subscriptions).toHaveLength(1);
      expect(subscriptions[0]!.active).toBe(false);
   });

   test("closes the overlay and removes listeners when the main window is destroyed", async () => {
      await openOverlay(null, { hwnd: 1, hostId: "voice-host" });
      const overlay = main.overlayWindow!.window;
      main._window.close();
      expect(overlay.isDestroyed()).toBe(true);
      expect(subscriptions.every((subscription) => !subscription.active)).toBe(true);
   });
});
