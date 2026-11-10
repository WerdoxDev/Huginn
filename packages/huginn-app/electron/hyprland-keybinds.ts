import { randomUUID } from "node:crypto";
import { createConnection, type Socket } from "node:net";
import path from "node:path";

import type { Keybind, KeybindType } from "@/types";

type Binding = { type: KeybindType; key: string; mods: number; chord: string };
type ExistingBinding = { key: string; modmask: number; description?: string; catch_all?: boolean; submap?: string };
const stateName = "__huginn_shortcuts";
const descriptionPrefix = "Huginn shortcut: ";
const leaseMs = 15_000;

const modifiers: Record<string, [string, number]> = {
   ctrl: ["CTRL", 4],
   control: ["CTRL", 4],
   shift: ["SHIFT", 1],
   alt: ["ALT", 8],
   meta: ["SUPER", 64],
};
const keyNames: Record<string, string> = {
   " ": "space",
   ArrowUp: "Up",
   ArrowDown: "Down",
   ArrowLeft: "Left",
   ArrowRight: "Right",
   Enter: "Return",
   Escape: "Escape",
   Backspace: "BackSpace",
   Delete: "Delete",
   Insert: "Insert",
   Home: "Home",
   End: "End",
   PageUp: "Prior",
   PageDown: "Next",
   Tab: "Tab",
   CapsLock: "Caps_Lock",
   NumLock: "Num_Lock",
   ScrollLock: "Scroll_Lock",
   Pause: "Pause",
   PrintScreen: "Print",
   ContextMenu: "Menu",
   "!": "exclam",
   '"': "quotedbl",
   "#": "numbersign",
   $: "dollar",
   "%": "percent",
   "&": "ampersand",
   "'": "apostrophe",
   "(": "parenleft",
   ")": "parenright",
   "*": "asterisk",
   "+": "plus",
   ",": "comma",
   "-": "minus",
   ".": "period",
   "/": "slash",
   ":": "colon",
   ";": "semicolon",
   "<": "less",
   "=": "equal",
   ">": "greater",
   "?": "question",
   "@": "at",
   "[": "bracketleft",
   "\\": "backslash",
   "]": "bracketright",
   "^": "asciicircum",
   _: "underscore",
   "`": "grave",
   "{": "braceleft",
   "|": "bar",
   "}": "braceright",
   "~": "asciitilde",
};

export function toHyprlandBinding(keybind: Keybind): Binding {
   let mods = 0;
   const names = new Set<string>();
   let key: string | undefined;
   for (const part of keybind.combination) {
      const modifier = modifiers[part.toLowerCase()];
      if (modifier) {
         names.add(modifier[0]);
         mods |= modifier[1];
      } else {
         if (key) throw new Error("A shortcut must have exactly one non-modifier key");
         if (keyNames[part]) key = keyNames[part];
         else if (/^[a-z0-9]$/i.test(part)) key = part.toLowerCase();
         else if (/^F([1-9]|[12][0-9]|3[0-5])$/.test(part)) key = part;
         // XKB's Unicode keysym notation also handles punctuation without embedding Lua syntax.
         else if ([...part].length === 1 && part.codePointAt(0)! >= 0x20)
            key = `U${part.codePointAt(0)!.toString(16).toUpperCase().padStart(4, "0")}`;
         else throw new Error(`Unsupported shortcut key: ${part}`);
      }
   }
   if (!key) throw new Error("A shortcut needs a non-modifier key");
   return { type: keybind.type, key, mods, chord: [...names, key].join(" + ") };
}

// Only pass generated ASCII strings to Lua. JSON escaping is not a general Lua string encoder.
function luaString(value: string) {
   if (!/^[\x20-\x7e]*$/.test(value)) throw new Error("Invalid Lua argument");
   return `"${value.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
}

export class HyprlandKeybinds {
   private readonly token = randomUUID();
   private readonly socketDirectory: string;
   private events?: Socket;
   private heartbeat?: ReturnType<typeof setInterval>;
   private queue = Promise.resolve();
   private bindings: Binding[] = [];
   private enabled = true;
   private stopped = false;

   constructor(
      private readonly fired: (type: KeybindType) => void,
      private readonly failed: (error: unknown) => void = console.error,
      socketDirectory?: string,
   ) {
      const { XDG_RUNTIME_DIR, HYPRLAND_INSTANCE_SIGNATURE } = process.env;
      if (!socketDirectory && (!XDG_RUNTIME_DIR || !HYPRLAND_INSTANCE_SIGNATURE)) throw new Error("Shortcuts require a Hyprland session");
      this.socketDirectory = socketDirectory ?? path.join(XDG_RUNTIME_DIR!, "hypr", HYPRLAND_INSTANCE_SIGNATURE!);
   }

   update(keybinds: Keybind[]) {
      return this.serialize(async () => {
         if (this.stopped) throw new Error("Shortcut service stopped");
         const bindings = keybinds.filter((keybind) => keybind.isEnabled && keybind.combination.length).map(toHyprlandBinding);
         if (new Set(bindings.map((binding) => `${binding.mods}:${binding.key}`)).size !== bindings.length)
            throw new Error("Shortcut already assigned");
         if (!bindings.length) {
            if (this.events) await this.release();
            this.disconnect();
            this.bindings = [];
            return;
         }
         await this.connect();
         try {
            await this.install(bindings);
         } catch (error) {
            // Restore the last working set if a compositor-side error interrupted replacement.
            if (this.bindings.length) await this.install(this.bindings).catch(this.failed);
            else this.disconnect();
            throw error;
         }
         this.bindings = bindings;
      });
   }

   setEnabled(enabled: boolean) {
      this.enabled = enabled;
      return this.serialize(async () => {
         if (!this.events || this.stopped) return;
         await this.eval(
            `local s = ${stateName}; if s and s.owner == ${luaString(this.token)} then for _, b in ipairs(s.bindings) do b.handle:set_enabled(${enabled} and b.active) end end`,
         );
      });
   }

   stop() {
      this.stopped = true;
      clearInterval(this.heartbeat);
      return this.serialize(async () => {
         try {
            if (this.events) await this.release();
         } finally {
            this.disconnect();
         }
      });
   }

   private disconnect() {
      clearInterval(this.heartbeat);
      this.heartbeat = undefined;
      this.events?.destroy();
      this.events = undefined;
   }

   private serialize<T>(operation: () => Promise<T>): Promise<T> {
      const result = this.queue.then(operation);
      this.queue = result.then(
         () => {},
         () => {},
      );
      return result;
   }

   private request(command: string): Promise<string> {
      return new Promise((resolve, reject) => {
         const socket = createConnection(path.join(this.socketDirectory, ".socket.sock"));
         let response = "";
         let ended = false;
         socket.setEncoding("utf8");
         socket.setTimeout(1500, () => socket.destroy(new Error("Hyprland shortcut request timed out")));
         socket.once("connect", () => socket.write(command));
         socket.on("data", (chunk: string) => {
            response += chunk;
            if (response.length > 8 * 1024 * 1024) socket.destroy(new Error("Hyprland reply exceeded its limit"));
         });
         socket.once("error", reject);
         socket.once("end", () => {
            ended = true;
            resolve(response);
            socket.destroy();
         });
         socket.once("close", () => {
            if (!ended) reject(new Error("Hyprland shortcut connection closed"));
         });
      });
   }

   private async eval(script: string) {
      const result = await this.request(`eval ${script}`);
      if (result.trim() !== "ok") throw new Error(`Hyprland shortcut registration failed: ${result.trim()}`);
   }

   private async connect() {
      if (this.events && !this.events.destroyed) return;
      this.events?.destroy();
      const events = (this.events = createConnection(path.join(this.socketDirectory, ".socket2.sock")));
      events.setEncoding("utf8");
      let pending = "";
      events.on("data", (chunk: string) => {
         pending += chunk;
         if (pending.length > 256 * 1024) return events.destroy(new Error("Hyprland shortcut event buffer exceeded its limit"));
         let end: number;
         while ((end = pending.indexOf("\n")) !== -1) {
            const line = pending.slice(0, end);
            pending = pending.slice(end + 1);
            const prefix = `custom>>huginn-keybind:${this.token}:`;
            if (line.startsWith(prefix) && this.enabled && !this.stopped) {
               const type = line.slice(prefix.length);
               if (this.bindings.some((binding) => binding.type === type)) this.fired(type as KeybindType);
            } else if (line === "configreloaded>>" && !this.stopped) {
               void this.serialize(() => this.install(this.bindings)).catch(this.failed);
            }
         }
      });
      await new Promise<void>((resolve, reject) => {
         events.setTimeout(1500, () => events.destroy(new Error("Hyprland shortcut event connection timed out")));
         events.once("connect", () => {
            events.setTimeout(0);
            resolve();
         });
         events.on("error", reject);
         events.on("error", (error) => {
            if (!this.stopped) this.failed(error);
         });
         events.once("close", () => reject(new Error("Hyprland shortcut event connection closed")));
      });
      if (!this.heartbeat && !this.stopped) {
         // A compositor-side lease disables orphaned bindings even if Electron crashes or is killed.
         this.heartbeat = setInterval(() => {
            if (this.stopped) return;
            void this.serialize(async () => {
               await this.connect();
               try {
                  await this.eval(
                     `local s = ${stateName}; assert(s and s.owner == ${luaString(this.token)}, "Shortcut lease expired"); s.timer:set_timeout(${leaseMs})`,
                  );
               } catch {
                  // Recover after a config reload or an expired lease without polling/rebinding on every tick.
                  await this.install(this.bindings);
               }
            }).catch(this.failed);
         }, 5000);
         this.heartbeat.unref();
      }
   }

   private async snapshot() {
      return JSON.parse(await this.request("j/binds")) as ExistingBinding[];
   }

   private async install(bindings: Binding[]) {
      if (this.stopped) return;
      const existing = await this.snapshot();
      for (const binding of bindings) {
         if (
            existing.some(
               (other) =>
                  !other.description?.startsWith(descriptionPrefix) &&
                  (other.catch_all || other.key.toLowerCase() === binding.key.toLowerCase()) &&
                  other.modmask === binding.mods,
            )
         ) {
            throw new Error(`Shortcut ${binding.chord} is already used by Hyprland`);
         }
      }
      // Keybind:unbind() also removes other bindings with the same key/modifiers in Hyprland 0.56.
      // Only remove an owned handle when no foreign binding shares its chord; otherwise disable it.
      const cleanup = this.cleanupScript(existing);
      const definitions = bindings
         .map(
            (binding) => `
         do
            local h = hl.bind(${luaString(binding.chord)}, hl.dsp.event(${luaString(`huginn-keybind:${this.token}:${binding.type}`)}), { description = ${luaString(descriptionPrefix + binding.type)}, dont_inhibit = true })
            h:set_enabled(${this.enabled})
            table.insert(s.bindings, { handle = h, key = ${luaString(binding.key)}, mods = ${binding.mods}, active = true })
         end`,
         )
         .join("\n");
      await this.eval(`
         assert(type(hl) == "table" and type(hl.timer) == "function", "Automatic Huginn shortcuts require Hyprland's Lua configuration API")
         local s = ${stateName}
         assert(not s or not s.owner or s.owner == ${luaString(this.token)}, "Huginn shortcuts are already owned by another running instance")
         if s then ${cleanup} else s = { bindings = {} }; ${stateName} = s end
         s.owner = ${luaString(this.token)}
         local ok, err = pcall(function()
            ${definitions}
            s.timer = hl.timer(function()
               for _, b in ipairs(s.bindings) do b.handle:set_enabled(false) end
               s.owner = nil
            end, { timeout = ${leaseMs}, type = "oneshot" })
         end)
         if not ok then for _, b in ipairs(s.bindings) do b.handle:set_enabled(false) end; s.owner = nil; error(err) end
      `);
   }

   private cleanupScript(existing: ExistingBinding[]) {
      const owned = existing.filter((binding) => binding.description?.startsWith(descriptionPrefix));
      const foreign = existing.filter(
         (binding) =>
            !binding.description?.startsWith(descriptionPrefix) &&
            owned.some((own) => own.modmask === binding.modmask && (binding.catch_all || own.key.toLowerCase() === binding.key.toLowerCase())),
      );
      const checks = foreign.map(
         (binding) =>
            `(b.mods == ${binding.modmask} and ${binding.catch_all ? "true" : `b.key:lower() == ${luaString(binding.key.replace(/[^\x20-\x7e]/g, "").toLowerCase())}`})`,
      );
      return `
         if s.timer then s.timer:set_enabled(false) end
         local retained = {}
         for _, b in ipairs(s.bindings) do
            b.handle:set_enabled(false)
            b.active = false
            if ${checks.length ? checks.join(" or ") : "false"} then table.insert(retained, b) else b.handle:unbind() end
         end
         s.bindings = retained
      `;
   }

   private async release() {
      const existing = await this.snapshot();
      await this.eval(`local s = ${stateName}; if s and s.owner == ${luaString(this.token)} then ${this.cleanupScript(existing)}; s.owner = nil end`);
   }
}
