/// <reference types="bun" />

import { afterEach, beforeEach, expect, mock, test } from "bun:test";
import { mkdtemp, rm } from "node:fs/promises";
import { createServer, type Server, type Socket } from "node:net";
import os from "node:os";
import path from "node:path";

import { HyprlandKeybinds, toHyprlandBinding } from "./hyprland-keybinds";

const unixTest = process.platform === "linux" ? test : test.skip;
const mute = { type: "toggle_mute" as const, combination: ["Ctrl", "Shift", "M"], isEnabled: true };
const deafen = { type: "toggle_deafen" as const, combination: ["Ctrl", "Shift", "D"], isEnabled: true };
let directory: string;
let commands: Server;
let events: Server;
let eventClient: Socket;
let service: HyprlandKeybinds;
let scripts: string[];
let existing: Array<{ key: string; modmask: number; description?: string }>;
let failNext: boolean;
let holdNext: boolean;
let held: (() => void) | undefined;
const sockets = new Set<Socket>();
const fired = mock();
const failed = mock();

async function until(check: () => boolean) {
   const deadline = Date.now() + 3000;
   while (!check() && Date.now() < deadline) await new Promise((resolve) => setTimeout(resolve, 5));
   expect(check()).toBe(true);
}

beforeEach(async () => {
   if (process.platform !== "linux") return;
   directory = await mkdtemp(path.join(os.tmpdir(), "huginn-shortcuts-"));
   scripts = [];
   existing = [];
   failNext = holdNext = false;
   held = undefined;
   fired.mockClear();
   failed.mockClear();
   commands = createServer((socket) => {
      sockets.add(socket);
      socket.on("close", () => sockets.delete(socket));
      socket.once("data", (data) => {
         const command = data.toString();
         if (command === "j/binds") return socket.end(JSON.stringify(existing));
         scripts.push(command);
         const response = failNext ? "error: cannot bind key" : "ok";
         failNext = false;
         const reply = () => socket.end(response);
         if (holdNext) {
            holdNext = false;
            held = reply;
         } else reply();
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
   service = new HyprlandKeybinds(fired, failed, directory);
});

afterEach(async () => {
   if (process.platform !== "linux") return;
   held?.();
   await service.stop();
   for (const socket of sockets) socket.destroy();
   sockets.clear();
   await Promise.all([new Promise((resolve) => commands.close(resolve)), new Promise((resolve) => events.close(resolve))]);
   await rm(directory, { recursive: true, force: true });
});

test("converts DOM keyboard names, punctuation and modifiers to XKB shortcuts", () => {
   expect(toHyprlandBinding(mute)).toMatchObject({ key: "m", mods: 5, chord: "CTRL + SHIFT + m" });
   expect(toHyprlandBinding({ ...mute, combination: ["Meta", "Alt", "ArrowUp"] })).toMatchObject({ key: "Up", mods: 72 });
   expect(toHyprlandBinding({ ...mute, combination: ["Ctrl", "+"] }).key).toBe("plus");
   expect(toHyprlandBinding({ ...mute, combination: [" "] }).key).toBe("space");
   expect(() => toHyprlandBinding({ ...mute, combination: ["Ctrl"] })).toThrow("non-modifier");
   expect(() => toHyprlandBinding({ ...mute, combination: ["M", "D"] })).toThrow("exactly one");
   expect(() => toHyprlandBinding({ ...mute, combination: ['"); os.execute("malicious")'] })).toThrow("Unsupported");
});

unixTest("registers both actions, dispatches framed events and suppresses actions while editing", async () => {
   await service.update([mute, deafen]);
   expect(scripts[0]).toContain('"CTRL + SHIFT + m"');
   expect(scripts[0]).toContain('"CTRL + SHIFT + d"');
   const token = scripts[0].match(/huginn-keybind:([a-f0-9-]+):/)![1];
   eventClient.write(`custom>>huginn-keybind:other:toggle_mute\ncustom>>huginn-keybind:${token}:toggle_`);
   eventClient.write(`mute\ncustom>>huginn-keybind:${token}:toggle_deafen\n`);
   await until(() => fired.mock.calls.length === 2);
   expect(fired.mock.calls.map((call) => call[0])).toEqual(["toggle_mute", "toggle_deafen"]);
   await service.setEnabled(false);
   eventClient.write(`custom>>huginn-keybind:${token}:toggle_mute\n`);
   await new Promise((resolve) => setTimeout(resolve, 15));
   expect(fired).toHaveBeenCalledTimes(2);
   await service.setEnabled(true);
   expect(fired).toHaveBeenCalledTimes(2);
   eventClient.write(`custom>>huginn-keybind:${token}:toggle_mute\n`);
   await until(() => fired.mock.calls.length === 3);
});

unixTest("rejects desktop conflicts and duplicate actions before changing bindings", async () => {
   await service.update([mute]);
   existing = [{ key: "D", modmask: 5, description: "Desktop shortcut" }];
   await expect(service.update([deafen])).rejects.toThrow("already used by Hyprland");
   expect(scripts.at(-1)).toContain('"CTRL + SHIFT + m"');
   await expect(service.update([mute, { ...deafen, combination: mute.combination }])).rejects.toThrow("already assigned");
});

unixTest("restores the previous working set when replacement fails", async () => {
   await service.update([mute]);
   failNext = true;
   await expect(service.update([deafen])).rejects.toThrow("cannot bind key");
   expect(scripts.at(-1)).toContain('"CTRL + SHIFT + m"');
   expect(scripts.at(-1)).not.toContain('"CTRL + SHIFT + d"');
});

unixTest("serializes quick successive updates and restores shortcuts after a config reload", async () => {
   holdNext = true;
   const first = service.update([mute]);
   await until(() => !!held);
   const second = service.update([deafen]);
   expect(scripts).toHaveLength(1);
   held!();
   await Promise.all([first, second]);
   expect(scripts).toHaveLength(2);
   eventClient.write("configreload");
   eventClient.write("ed>>\n");
   await until(() => scripts.length === 3);
   expect(scripts.at(-1)).toContain('"CTRL + SHIFT + d"');
   expect(scripts.at(-1)).not.toContain('"CTRL + SHIFT + m"');
});

unixTest("does not register disabled or empty shortcuts and releases owned bindings on stop", async () => {
   await service.update([
      { ...mute, isEnabled: false },
      { ...deafen, combination: [] },
   ]);
   expect(scripts).toHaveLength(0);
   await service.update([mute]);
   await service.stop();
   expect(scripts.at(-1)).toContain("s.owner = nil");
   expect(scripts.at(-1)).toContain("b.handle:unbind()");
   await until(() => eventClient.destroyed);
   await expect(service.update([mute])).rejects.toThrow("stopped");
});

unixTest("disables rather than broadly unbinding when another runtime binding shares the chord", async () => {
   await service.update([mute]);
   existing = [
      { key: "m", modmask: 5, description: "Huginn shortcut: toggle_mute" },
      { key: "m", modmask: 5, description: "Another app" },
   ];
   await service.stop();
   expect(scripts.at(-1)).toContain('b.mods == 5 and b.key:lower() == "m"');
   expect(scripts.at(-1)).toContain("b.handle:set_enabled(false)");
});
