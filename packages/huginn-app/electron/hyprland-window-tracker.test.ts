/// <reference types="bun" />

import { afterEach, beforeEach, expect, mock, test } from "bun:test";
import { mkdtemp, rm } from "node:fs/promises";
import { createServer, type Server, type Socket } from "node:net";
import os from "node:os";
import path from "node:path";

import { HyprlandWindowTracker } from "./hyprland-window-tracker";

const unixTest = process.platform === "linux" ? test : test.skip;
let directory: string;
let commands: Server;
let events: Server;
let eventClient: Socket;
let tracker: HyprlandWindowTracker;
let clients = [{ address: "0xabc", at: [-1800, 160], size: [1000, 800], monitor: 0, mapped: true, hidden: false }];
let active = "0xabc";
let held: Array<() => void>;
let hold: boolean;
const sockets = new Set<Socket>();
const monitors = [
   { id: 0, name: "DP-1", x: -1920, y: 120, scale: 1.25 },
   { id: 1, name: "DP-2", x: 0, y: 0, scale: 2 },
];
const update = mock();
const closed = mock();
const error = mock();

async function until(check: () => boolean) {
   const deadline = Date.now() + 3000;
   while (!check() && Date.now() < deadline) await new Promise((resolve) => setTimeout(resolve, 5));
   expect(check()).toBe(true);
}

beforeEach(async () => {
   if (process.platform !== "linux") return;
   directory = await mkdtemp(path.join(os.tmpdir(), "huginn-hypr-"));
   active = "0xabc";
   clients = [{ address: "0xabc", at: [-1800, 160], size: [1000, 800], monitor: 0, mapped: true, hidden: false }];
   held = [];
   hold = false;
   update.mockClear();
   closed.mockClear();
   error.mockClear();
   commands = createServer((socket) => {
      sockets.add(socket);
      socket.on("close", () => sockets.delete(socket));
      socket.once("data", (command) => {
         const response = JSON.stringify(
            command.toString() === "j/clients" ? clients : command.toString() === "j/activewindow" ? { address: active } : monitors,
         );
         const reply = () => socket.end(response);
         if (hold) held.push(reply);
         else reply();
      });
   });
   events = createServer((socket) => {
      eventClient = socket;
      sockets.add(socket);
      socket.on("close", () => sockets.delete(socket));
   });
   await Promise.all([
      new Promise<void>((resolve) => commands.listen(path.join(directory, ".socket.sock"), resolve)),
      new Promise<void>((resolve) => events.listen(path.join(directory, ".socket2.sock"), resolve)),
   ]);
   tracker = new HyprlandWindowTracker("0xabc", { update, closed, error }, directory);
});

afterEach(async () => {
   if (process.platform !== "linux") return;
   tracker.stop();
   for (const socket of sockets) socket.destroy();
   sockets.clear();
   await Promise.all([new Promise((resolve) => commands.close(resolve)), new Promise((resolve) => events.close(resolve))]);
   await rm(directory, { recursive: true, force: true });
});

unixTest("uses output-local logical geometry and follows resizing and monitor changes", async () => {
   await tracker.start();
   expect(update).toHaveBeenLastCalledWith({ output: "DP-1", x: 120, y: 40, width: 400, height: 800 });
   clients[0] = { ...clients[0], at: [40, 80], size: [300, 600], monitor: 1 };
   await until(() => update.mock.calls.length === 2);
   expect(update).toHaveBeenLastCalledWith({ output: "DP-2", x: 40, y: 80, width: 300, height: 600 });
   expect(error).not.toHaveBeenCalled();
});

unixTest("hides immediately on focus loss and discards an older in-flight focused snapshot", async () => {
   await tracker.start();
   hold = true;
   await until(() => held.length === 3);
   active = "0xdef";
   // Exercise split event packets as well as addresses without the 0x prefix.
   eventClient.write("activewindowv2>>d");
   eventClient.write("ef\n");
   await until(() => update.mock.calls.length === 2);
   expect(update).toHaveBeenLastCalledWith(undefined);
   hold = false;
   for (const reply of held.splice(0)) reply();
   await new Promise((resolve) => setTimeout(resolve, 150));
   expect(update).toHaveBeenCalledTimes(2);
   active = "0xabc";
   eventClient.write("activewindowv2>>abc\n");
   await until(() => update.mock.calls.length === 3);
   expect(update).toHaveBeenLastCalledWith(expect.objectContaining({ output: "DP-1" }));
});

unixTest("closes once when the target closes and stops listening", async () => {
   await tracker.start();
   eventClient.write("closewindow>>def\nclosewindow>>abc\n");
   await until(() => closed.mock.calls.length === 1);
   await until(() => eventClient.destroyed);
   expect(error).not.toHaveBeenCalled();
});

unixTest("closes if the target disappears from a snapshot without a close event", async () => {
   await tracker.start();
   clients = [];
   await until(() => closed.mock.calls.length === 1);
});

unixTest("hides and reports a lost compositor connection", async () => {
   await tracker.start();
   eventClient.destroy();
   await until(() => error.mock.calls.length === 1);
   expect(update).toHaveBeenLastCalledWith(undefined);
});

unixTest("cancels outstanding snapshots on stop without publishing late updates", async () => {
   await tracker.start();
   hold = true;
   await until(() => held.length === 3);
   tracker.stop();
   await until(() => sockets.size === 0);
   expect(update).toHaveBeenCalledTimes(1);
   expect(closed).not.toHaveBeenCalled();
   expect(error).not.toHaveBeenCalled();
});
