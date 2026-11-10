import type { Writable } from "node:stream";

import type { OverlayGeometry } from "./hyprland-window-tracker";

function packet(type: number, width = 0, height = 0, x = 0, y = 0, payload: Buffer = Buffer.alloc(0)) {
   const header = Buffer.alloc(24);
   header.writeUInt32LE(type, 0);
   header.writeUInt32LE(width, 4);
   header.writeUInt32LE(height, 8);
   header.writeInt32LE(x, 12);
   header.writeInt32LE(y, 16);
   header.writeUInt32LE(payload.length, 20);
   return Buffer.concat([header, payload]);
}

/** Coalesces paints under backpressure; focus and geometry always precede the latest frame. */
export class HyprlandOverlayTransport {
   private control?: Buffer;
   private frame?: Buffer;
   private visible = false;
   private blocked = false;
   private closed = false;

   constructor(private readonly stream: Writable) {
      stream.on("drain", this.drain);
   }

   configure(geometry: OverlayGeometry) {
      this.visible = true;
      this.control = packet(1, geometry.width, geometry.height, geometry.x, geometry.y, Buffer.from(geometry.output));
      this.frame = undefined;
      this.flush();
   }

   hide() {
      this.visible = false;
      this.control = packet(3);
      this.frame = undefined;
      this.flush();
   }

   paint(width: number, height: number, bitmap: Buffer) {
      if (!this.visible || this.closed) return;
      if (width <= 0 || height <= 0 || width > 8192 || height > 8192 || bitmap.length !== width * height * 4 || bitmap.length > 64 * 1024 * 1024) {
         throw new Error("Invalid Electron overlay bitmap");
      }
      this.frame = packet(2, width, height, 0, 0, bitmap);
      this.flush();
   }

   close() {
      this.closed = true;
      this.control = this.frame = undefined;
      this.stream.off("drain", this.drain);
   }

   private readonly drain = () => {
      this.blocked = false;
      this.flush();
   };

   private flush() {
      while (!this.closed && !this.blocked && !this.stream.destroyed) {
         const data = this.control ?? this.frame;
         if (!data) return;
         if (this.control) this.control = undefined;
         else this.frame = undefined;
         this.blocked = !this.stream.write(data);
      }
   }
}
