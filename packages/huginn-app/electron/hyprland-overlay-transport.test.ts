/// <reference types="bun" />

import { expect, test } from "bun:test";
import { Writable } from "node:stream";

import { HyprlandOverlayTransport } from "./hyprland-overlay-transport";

function slowConsumer() {
   const packets: Buffer[] = [];
   let release!: () => void;
   const stream = new Writable({
      highWaterMark: 1,
      write(chunk, _encoding, callback) {
         packets.push(chunk);
         release = callback;
      },
   });
   return {
      packets,
      transport: new HyprlandOverlayTransport(stream),
      release: async () => {
         release();
         await new Promise((resolve) => setImmediate(resolve));
      },
   };
}

const geometry = { output: "DP-1", x: -10, y: 30, width: 2, height: 1 };

test("drops queued paints on focus loss even when the helper is blocked", async () => {
   const consumer = slowConsumer();
   consumer.transport.configure(geometry);
   for (let i = 0; i < 50; ++i) consumer.transport.paint(2, 1, Buffer.alloc(8, i));
   consumer.transport.hide();
   await consumer.release();
   expect(consumer.packets.map((packet) => packet.readUInt32LE(0))).toEqual([1, 3]);
   await consumer.release();
   expect(consumer.packets).toHaveLength(2);
   consumer.transport.close();
});

test("coalesces queued paints to the latest bitmap and preserves signed geometry", async () => {
   const consumer = slowConsumer();
   consumer.transport.configure(geometry);
   for (let i = 0; i < 50; ++i) consumer.transport.paint(2, 1, Buffer.alloc(8, i));
   expect(consumer.packets).toHaveLength(1);
   expect(consumer.packets[0].readInt32LE(12)).toBe(-10);
   await consumer.release();
   expect(consumer.packets[1].readUInt32LE(0)).toBe(2);
   expect(consumer.packets[1].subarray(24)).toEqual(Buffer.alloc(8, 49));
   consumer.transport.close();
});

test("rejects malformed bitmaps and cancels pending writes on shutdown", async () => {
   const consumer = slowConsumer();
   consumer.transport.configure(geometry);
   expect(() => consumer.transport.paint(2, 1, Buffer.alloc(7))).toThrow("Invalid Electron overlay bitmap");
   consumer.transport.paint(2, 1, Buffer.alloc(8));
   consumer.transport.close();
   await consumer.release();
   expect(consumer.packets).toHaveLength(1);
});
