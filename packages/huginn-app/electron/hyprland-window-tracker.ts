import { createConnection, type Socket } from "node:net";
import path from "node:path";

type Client = {
   address: string;
   at: [number, number];
   size: [number, number];
   monitor: number;
   mapped?: boolean;
   hidden?: boolean;
   visible?: boolean;
};

type Monitor = { id: number; name: string; x: number; y: number; disabled?: boolean };

export type OverlayGeometry = { output: string; x: number; y: number; width: number; height: number };

function normalizeAddress(address: string) {
   return address.replace(/^0x/i, "").toLowerCase();
}

export function getOverlayGeometry(client: Client, monitors: Monitor[]): OverlayGeometry | undefined {
   const monitor = monitors.find((monitor) => monitor.id === client.monitor && !monitor.disabled);
   if (!monitor || client.mapped === false || client.hidden || client.visible === false) return;
   const [x, y] = client.at;
   const [width, height] = client.size;
   if (![x, y, width, height, monitor.x, monitor.y].every(Number.isFinite) || width <= 0 || height <= 0) return;
   // Hyprland positions and sizes are logical, including on fractionally scaled outputs.
   // Only render the strip containing VoiceOverlay instead of copying a full game frame.
   return {
      output: monitor.name,
      x: Math.round(x - monitor.x),
      y: Math.round(y - monitor.y),
      width: Math.min(400, Math.round(width)),
      height: Math.min(8192, Math.round(height)),
   };
}

export class HyprlandWindowTracker {
   private readonly sockets = new Set<Socket>();
   private readonly socketDirectory: string;
   private events?: Socket;
   private timer?: ReturnType<typeof setInterval>;
   private stopped = false;
   private refreshing = false;
   private dirty = false;
   private revision = 0;
   private lastGeometry = "";

   constructor(
      private readonly address: string,
      private readonly callbacks: {
         update: (geometry: OverlayGeometry | undefined) => void;
         closed: () => void;
         error: (error: Error) => void;
      },
      socketDirectory?: string,
   ) {
      if (!/^0x[0-9a-f]+$/i.test(address) || normalizeAddress(address) === "0") throw new Error("Invalid Hyprland window address");
      const { XDG_RUNTIME_DIR, HYPRLAND_INSTANCE_SIGNATURE } = process.env;
      if (!socketDirectory && (!XDG_RUNTIME_DIR || !HYPRLAND_INSTANCE_SIGNATURE)) throw new Error("The overlay requires a Hyprland session");
      this.socketDirectory = socketDirectory ?? path.join(XDG_RUNTIME_DIR!, "hypr", HYPRLAND_INSTANCE_SIGNATURE!);
   }

   async start() {
      if (this.stopped) return;
      const events = (this.events = createConnection(path.join(this.socketDirectory, ".socket2.sock")));
      events.setEncoding("utf8");
      let pending = "";
      events.on("data", (chunk: string) => {
         pending += chunk;
         if (pending.length > 256 * 1024) return this.fail(new Error("Hyprland event buffer exceeded its limit"));
         let end: number;
         while ((end = pending.indexOf("\n")) !== -1) {
            const line = pending.slice(0, end);
            pending = pending.slice(end + 1);
            this.event(line);
         }
      });
      await new Promise<void>((resolve, reject) => {
         let connected = false;
         events.setTimeout(1500, () => events.destroy(new Error("Hyprland event connection timed out")));
         events.once("connect", () => {
            connected = true;
            events.setTimeout(0);
            resolve();
         });
         events.on("error", (error) => {
            reject(error);
            if (connected) this.fail(error);
         });
         events.once("close", () => {
            reject(new Error("Hyprland event connection closed"));
            if (!this.stopped) this.fail(new Error("Hyprland event connection closed"));
         });
      });
      if (this.stopped) return;
      // IPC has focus/close/workspace events, but no continuous window geometry event.
      this.timer = setInterval(() => void this.refresh(), 100);
      await this.refresh();
   }

   stop() {
      this.stopped = true;
      clearInterval(this.timer);
      this.events?.destroy();
      for (const socket of this.sockets) socket.destroy();
      this.sockets.clear();
   }

   private fail(error: Error) {
      if (this.stopped) return;
      this.stop();
      this.callbacks.update(undefined);
      this.callbacks.error(error);
   }

   private event(line: string) {
      if (this.stopped) return;
      const separator = line.indexOf(">>");
      if (separator === -1) return;
      const name = line.slice(0, separator);
      const data = line.slice(separator + 2);
      if (name === "closewindow" && normalizeAddress(data) === normalizeAddress(this.address)) {
         this.stop();
         this.callbacks.closed();
         return;
      }
      if (name === "activewindowv2") {
         ++this.revision;
         // Hide immediately on focus loss, including while an earlier snapshot is in flight.
         if (normalizeAddress(data) !== normalizeAddress(this.address)) this.update(undefined);
      }
      if (
         /^(activewindowv2|openwindow|closewindow|movewindowv2|workspacev2|focusedmonv2|fullscreen|changefloatingmode|monitoraddedv2|monitorremoved|configreloaded|activespecialv2)$/.test(
            name,
         )
      ) {
         void this.refresh();
      }
   }

   private query<T>(command: string): Promise<T> {
      return new Promise((resolve, reject) => {
         const socket = createConnection(path.join(this.socketDirectory, ".socket.sock"));
         this.sockets.add(socket);
         let data = "";
         let ended = false;
         socket.setEncoding("utf8");
         socket.setTimeout(1500, () => socket.destroy(new Error(`Hyprland ${command} timed out`)));
         socket.once("connect", () => socket.write(`j/${command}`));
         socket.on("data", (chunk: string) => {
            data += chunk;
            if (data.length > 8 * 1024 * 1024) socket.destroy(new Error("Hyprland reply exceeded its limit"));
         });
         socket.once("error", reject);
         socket.once("end", () => {
            ended = true;
            try {
               resolve(JSON.parse(data) as T);
            } catch (error) {
               reject(error);
            }
            socket.destroy();
         });
         socket.once("close", () => {
            this.sockets.delete(socket);
            if (!ended) reject(new Error(`Hyprland ${command} connection closed`));
         });
      });
   }

   private update(geometry: OverlayGeometry | undefined) {
      const key = JSON.stringify(geometry) ?? "";
      if (key === this.lastGeometry) return;
      this.lastGeometry = key;
      this.callbacks.update(geometry);
   }

   private async refresh() {
      if (this.stopped) return;
      if (this.refreshing) {
         this.dirty = true;
         return;
      }
      this.refreshing = true;
      this.dirty = false;
      const revision = this.revision;
      try {
         const [clients, active, monitors] = await Promise.all([
            this.query<Client[]>("clients"),
            this.query<{ address?: string }>("activewindow"),
            this.query<Monitor[]>("monitors"),
         ]);
         if (this.stopped || revision !== this.revision) return;
         const client = clients.find((client) => normalizeAddress(client.address) === normalizeAddress(this.address));
         if (!client) {
            this.stop();
            this.callbacks.closed();
            return;
         }
         this.update(
            active.address && normalizeAddress(active.address) === normalizeAddress(this.address) ? getOverlayGeometry(client, monitors) : undefined,
         );
      } catch (error) {
         this.fail(error instanceof Error ? error : new Error(String(error)));
      } finally {
         this.refreshing = false;
         if (this.dirty && !this.stopped) void this.refresh();
      }
   }
}
