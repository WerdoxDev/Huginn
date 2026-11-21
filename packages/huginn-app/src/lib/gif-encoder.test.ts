import sharp from "sharp";
import { describe, expect, it } from "vitest";

import { encodeGifFrame } from "./gif-encoder";

function encode(frames: number[][][], delays = frames.map(() => 100)) {
   const parts = frames.map((pixels, index) =>
      encodeGifFrame({
         data: new Uint8ClampedArray(pixels.flat()),
         width: pixels.length,
         height: 1,
         index,
         last: index === frames.length - 1,
         delay: delays[index],
         repeat: 0,
         canTransfer: true,
      }),
   );
   // Assemble the worker responses in the same way as gif.js.
   return Buffer.concat(parts.flatMap((part) => part.data.map((page) => Buffer.from(page.subarray(0, part.cursor)))));
}

async function decode(gif: Buffer) {
   const { data } = await sharp(gif, { animated: true }).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
   return Array.from({ length: data.length / 4 }, (_, index) => [...data.subarray(index * 4, index * 4 + 4)]);
}

describe("GIF crop encoding", () => {
   it("preserves opaque black alongside actual transparency", async () => {
      const pixels = [
         [0, 0, 0, 255],
         [1, 1, 1, 255],
         [255, 0, 255, 255],
         [255, 255, 255, 255],
         [0, 0, 0, 0],
         [255, 0, 255, 0],
      ];
      const result = await decode(encode([pixels]));
      expect(result.slice(0, 4).map((pixel) => pixel[3])).toEqual([255, 255, 255, 255]);
      // Quantization may merge black and near-black; both must remain opaque.
      expect(result[0].slice(0, 3).every((channel) => channel <= 1)).toBe(true);
      expect(result[2]).toEqual([255, 0, 255, 255]);
      expect(result.slice(4).map((pixel) => pixel[3])).toEqual([0, 0]);
   });

   it("keeps every pixel opaque when the source has no transparency", async () => {
      const pixels = [
         [0, 0, 0, 255],
         [255, 0, 0, 255],
         [0, 255, 0, 255],
         [0, 0, 255, 255],
      ];
      expect(await decode(encode([pixels]))).toEqual(pixels);
   });

   it("handles fully transparent frames", async () => {
      const gif = encode([
         [
            [0, 0, 0, 0],
            [255, 255, 255, 0],
         ],
      ]);
      expect((await decode(gif)).map((pixel) => pixel[3])).toEqual([0, 0]);
   });

   it("uses the GIF alpha threshold without keying out opaque colors", async () => {
      const gif = encode([
         [
            [0, 0, 0, 127],
            [0, 0, 0, 128],
            [255, 0, 255, 127],
            [255, 0, 255, 128],
         ],
      ]);
      expect((await decode(gif)).map((pixel) => pixel[3])).toEqual([0, 255, 0, 255]);
   });

   it("preserves animation timing and clears pixels that become transparent", async () => {
      const frames = [
         [
            [0, 0, 0, 255],
            [255, 0, 0, 255],
         ],
         [
            [0, 0, 0, 0],
            [0, 0, 0, 255],
         ],
         [
            [0, 0, 0, 0],
            [0, 0, 0, 0],
         ],
         [
            [0, 0, 0, 255],
            [0, 0, 255, 255],
         ],
      ];
      const gif = encode(frames, [100, 200, 300, 400]);
      expect(await decode(gif)).toEqual(frames.flat());
      expect(await sharp(gif, { animated: true }).metadata()).toMatchObject({
         width: 2,
         pageHeight: 1,
         pages: 4,
         delay: [100, 200, 300, 400],
         loop: 0,
      });
   });

   it("keeps transparency separate when the image needs all available palette colors", async () => {
      const colors = Array.from({ length: 256 }, (_, i) => [i, (i * 17) % 256, (i * 31) % 256, 255]);
      const result = await decode(encode([[...colors, [0, 0, 0, 0]]]));
      expect(result.slice(0, 256).every((pixel) => pixel[3] === 255)).toBe(true);
      expect(result[256][3]).toBe(0);
   });
});
