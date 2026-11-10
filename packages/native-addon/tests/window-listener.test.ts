import { describe, expect, test } from "bun:test";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { fileURLToPath } from "node:url";

import addon, { type WindowBounds } from "../js/index";

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function waitFor(condition: () => boolean) {
   const deadline = Date.now() + 5000;
   while (!condition()) {
      if (Date.now() > deadline) throw new Error("Timed out waiting for a window notification");
      await delay(20);
   }
}

async function createWindow() {
   const child = spawn("powershell.exe", [
      "-NoProfile",
      "-NonInteractive",
      "-ExecutionPolicy",
      "Bypass",
      "-File",
      fileURLToPath(new URL("./fixtures/window-listener.ps1", import.meta.url)),
   ]);
   let output = "";
   let errors = "";
   child.stdout.on("data", (chunk) => (output += chunk));
   child.stderr.on("data", (chunk) => (errors += chunk));
   const exited = once(child, "exit");
   try {
      await waitFor(() => output.includes("\n") || child.exitCode !== null);
      if (child.exitCode !== null) throw new Error(`Test window exited: ${errors}`);
   } catch (error) {
      child.kill();
      throw error;
   }

   return {
      hwnd: Number(output.trim()),
      async change(bounds: string) {
         output = "";
         child.stdin.write(`${bounds}\n`);
         await waitFor(() => output.includes("changed") && output.includes("\n"));
         const [x, y, width, height] = output.trim().split(" ").slice(1).map(Number);
         return { x: x!, y: y!, width: width!, height: height! };
      },
      async focus(focused: boolean) {
         output = "";
         child.stdin.write(focused ? "focus\n" : "blur\n");
         await waitFor(() => output.includes("focused") || child.exitCode !== null);
         if (child.exitCode !== null) throw new Error(`Focus test window exited: ${errors}`);
      },
      async close() {
         if (child.exitCode === null) child.stdin.end("close\n");
         await exited;
      },
      async terminate() {
         child.kill();
         await exited;
      },
   };
}

describe.skipIf(process.platform !== "win32")("Windows window bounds listener", () => {
   test("rejects invalid handles and callbacks", () => {
      for (const hwnd of [0, -1, NaN, Infinity, 1.5, Number.MAX_SAFE_INTEGER + 1]) {
         expect(() => addon.listenToWindowBounds(hwnd, () => {})).toThrow(TypeError);
         expect(() => addon.listenToWindowClose(hwnd, () => {})).toThrow(TypeError);
         expect(() => addon.listenToWindowFocus(hwnd, () => {})).toThrow(TypeError);
      }
      expect(() => addon.listenToWindowBounds(1, null as never)).toThrow(TypeError);
      expect(() => addon.listenToWindowClose(1, null as never)).toThrow(TypeError);
      expect(() => addon.listenToWindowFocus(1, null as never)).toThrow(TypeError);
   });

   test("reports moves and resizes to independent listeners; unlisten is idempotent", async () => {
      const window = await createWindow();
      const first: WindowBounds[] = [];
      const second: WindowBounds[] = [];
      const stopFirst = addon.listenToWindowBounds(window.hwnd, (bounds) => first.push(bounds));
      const stopSecond = addon.listenToWindowBounds(window.hwnd, (bounds) => second.push(bounds));
      try {
         await delay(100);
         expect(first).toHaveLength(0);
         const expectedMoved = await window.change("200 200 320 240");
         await waitFor(() => first.length > 0 && second.length > 0);
         const moved = first.at(-1)!;
         expect(moved).toEqual(expectedMoved);
         expect(second.at(-1)).toEqual(expectedMoved);
         expect(moved.width).toBeGreaterThan(0);
         expect(moved.height).toBeGreaterThan(0);

         const expectedResized = await window.change("200 200 640 480");
         await waitFor(() => first.at(-1)!.width > moved.width && second.at(-1)!.width > moved.width);
         expect(first.at(-1)!.height).toBeGreaterThan(moved.height);
         expect(first.at(-1)).toEqual(expectedResized);
         expect(second.at(-1)).toEqual(expectedResized);

         stopFirst();
         stopFirst();
         const count = first.length;
         const otherCount = second.length;
         await window.change("300 300 640 480");
         await waitFor(() => second.length > otherCount);
         expect(first).toHaveLength(count);
      } finally {
         stopFirst();
         stopSecond();
         await window.close();
      }
   }, 15000);

   test("allows unlistening from inside the callback", async () => {
      const window = await createWindow();
      let calls = 0;
      const unlisten = addon.listenToWindowBounds(window.hwnd, () => {
         calls++;
         unlisten();
      });
      try {
         await window.change("200 200 640 480");
         await waitFor(() => calls > 0);
         await window.change("300 300 320 240");
         await delay(100);
         expect(calls).toBe(1);
      } finally {
         unlisten();
         await window.close();
      }
   }, 15000);

   test("reports initial focus, gain and loss, deduplicates unchanged state and supports unlisten", async () => {
      const window = await createWindow();
      const states: boolean[] = [];
      const unlisten = addon.listenToWindowFocus(window.hwnd, (focused) => states.push(focused));
      try {
         await waitFor(() => states.length > 0);
         expect(typeof states[0]).toBe("boolean");
         await window.focus(true);
         await waitFor(() => states.at(-1) === true);
         const gainedCount = states.length;
         await window.focus(true);
         await delay(100);
         expect(states).toHaveLength(gainedCount);
         await window.focus(false);
         await waitFor(() => states.at(-1) === false);
         const count = states.length;
         unlisten();
         unlisten();
         await window.focus(true);
         await delay(100);
         expect(states).toHaveLength(count);
      } finally {
         unlisten();
         await window.close();
      }
   }, 15000);

   test.each(["close", "terminate"] as const)(
      "reports %s once, supports independent listeners and cancellation",
      async (action) => {
         const window = await createWindow();
         let calls = 0;
         let cancelledCalls = 0;
         const unlisten = addon.listenToWindowClose(window.hwnd, () => {
            calls++;
            unlisten();
         });
         const stopCancelled = addon.listenToWindowClose(window.hwnd, () => cancelledCalls++);
         try {
            await window.change("200 200 640 480");
            await delay(100);
            expect(calls).toBe(0);
            stopCancelled();
            stopCancelled();
            await window[action]();
            await waitFor(() => calls === 1);
            await delay(100);
            expect(calls).toBe(1);
            expect(cancelledCalls).toBe(0);
            expect(() => unlisten()).not.toThrow();
         } finally {
            unlisten();
            stopCancelled();
            await window.close();
         }
      },
      15000,
   );

   test.each([
      ["listenToWindowBounds", "close"],
      ["listenToWindowBounds", "terminate"],
      ["listenToWindowClose", "close"],
      ["listenToWindowClose", "terminate"],
      ["listenToWindowFocus", "close"],
      ["listenToWindowFocus", "terminate"],
   ] as const)(
      "%s releases the callback after %s even when unlisten is retained",
      async (method, action) => {
         const window = await createWindow();
         // Return only a WeakRef so this test itself does not retain the callback.
         const { weak, unlisten } = (() => {
            const callback = () => {};
            return { weak: new WeakRef(callback), unlisten: addon[method](window.hwnd, callback) };
         })();
         try {
            await window[action]();
            await waitFor(() => {
               Bun.gc(true);
               return weak.deref() === undefined;
            });
            expect(() => unlisten()).not.toThrow();
            expect(() => unlisten()).not.toThrow();
            expect(() => addon[method](window.hwnd, () => {})).toThrow();
         } finally {
            unlisten();
            await window.close();
         }
      },
      15000,
   );
});
