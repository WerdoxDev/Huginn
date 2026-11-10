import { afterEach, beforeEach, expect, mock, test } from "bun:test";
import { EventEmitter } from "node:events";

import type { Keybind } from "@/types";

const app = Object.assign(new EventEmitter(), { quit: mock() });
const callbacks = new Map<string, () => void>();
const globalShortcut = {
   unregisterAll: mock(() => callbacks.clear()),
   register: mock((accelerator: string, callback: () => void) => {
      if (accelerator === "CmdOrCtrl+X") return false;
      callbacks.set(accelerator, callback);
      return true;
   }),
};
let update: (_: unknown, keybinds: Keybind[]) => Promise<boolean>;
let setEnabled: (_: unknown, enabled: boolean) => void;
mock.module("electron", () => ({
   app,
   globalShortcut,
   ipcMain: {
      handle: (_channel: string, callback: typeof update) => {
         update = callback;
      },
      on: (_channel: string, callback: typeof setEnabled) => {
         setEnabled = callback;
      },
   },
}));
const { registerEvents } = await import("./keybinds-controller");
const originalSignature = process.env.HYPRLAND_INSTANCE_SIGNATURE;
const send = mock();
const window = Object.assign(new EventEmitter(), { webContents: { send, isDestroyed: () => false } });
const mute: Keybind = { type: "toggle_mute", combination: ["Ctrl", "M"], isEnabled: true };
const deafen: Keybind = { type: "toggle_deafen", combination: ["Ctrl", "D"], isEnabled: true };

beforeEach(() => {
   delete process.env.HYPRLAND_INSTANCE_SIGNATURE;
   callbacks.clear();
   send.mockClear();
   app.quit.mockClear();
   app.removeAllListeners();
   window.removeAllListeners();
   registerEvents(window as never);
   setEnabled(null, true);
});

afterEach(() => {
   if (originalSignature === undefined) delete process.env.HYPRLAND_INSTANCE_SIGNATURE;
   else process.env.HYPRLAND_INSTANCE_SIGNATURE = originalSignature;
});

test("registers every shortcut rather than returning after the first registration", async () => {
   expect(await update(null, [mute, deafen])).toBe(true);
   expect([...callbacks.keys()]).toEqual(["CmdOrCtrl+M", "CmdOrCtrl+D"]);
   callbacks.get("CmdOrCtrl+D")!();
   expect(send).toHaveBeenCalledWith("keybinds:fired", "toggle_deafen");
   setEnabled(null, false);
   callbacks.get("CmdOrCtrl+M")!();
   expect(send).toHaveBeenCalledTimes(1);
});

test("reports false registrations and restores the working shortcuts", async () => {
   expect(await update(null, [mute])).toBe(true);
   expect(await update(null, [deafen, { ...mute, combination: ["Ctrl", "X"] }])).toBe(false);
   expect([...callbacks.keys()]).toEqual(["CmdOrCtrl+M"]);
});

test("clears disabled shortcuts and unregisters before completing quit", async () => {
   await update(null, [mute, { ...deafen, isEnabled: false }]);
   expect(callbacks.size).toBe(1);
   const preventDefault = mock();
   app.emit("before-quit", { preventDefault });
   expect(preventDefault).toHaveBeenCalledTimes(1);
   expect(callbacks.size).toBe(0);
   await new Promise((resolve) => setTimeout(resolve, 0));
   expect(app.quit).toHaveBeenCalledTimes(1);
   app.emit("before-quit", { preventDefault });
   expect(preventDefault).toHaveBeenCalledTimes(1);
});
