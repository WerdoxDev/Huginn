import { CONSTANTS, Errors } from "@huginnjs/shared";
import { describe, expect, mock, test } from "bun:test";
import { status } from "elysia";
import sharp from "sharp";
mock.module("../server", () => ({ storage: {} }));
const { prepareStickerImage } = await import("../utils/route-utils");
async function prepare(input: Blob) {
   const result = await prepareStickerImage(input, status);
   if (!("file" in result)) throw new Error("Unexpected image validation failure");
   return result;
}

describe("sticker images", () => {
   test("resizes large images and retains transparency", async () => {
      const png = await sharp({ create: { width: 1024, height: 512, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
         .png()
         .toBuffer();
      const result = await prepare(new Blob([new Uint8Array(png)]));
      expect(result.width).toBe(512);
      expect(result.height).toBe(256);
      const metadata = await sharp(Buffer.from(await result.file.arrayBuffer())).metadata();
      expect(metadata.format).toBe("webp");
      expect(metadata.hasAlpha).toBe(true);
   });

   test("preserves GIF frames, timing, and per-frame dimensions", async () => {
      const pixels = Buffer.alloc(16 * 32 * 4);
      for (let i = 0; i < 16 * 32; i++) {
         pixels[i * 4 + (i < 256 ? 0 : 2)] = 255;
         pixels[i * 4 + 3] = 255;
      }
      const gif = await sharp(pixels, { raw: { width: 16, height: 32, channels: 4, pageHeight: 16 } })
         .gif({ delay: [100, 200], loop: 0 })
         .toBuffer();
      const result = await prepare(new Blob([new Uint8Array(gif)]));
      const metadata = await sharp(Buffer.from(await result.file.arrayBuffer()), { animated: true }).metadata();
      expect(metadata.pages).toBe(2);
      expect(metadata.delay).toEqual([100, 200]);
      expect(result.width).toBe(16);
      expect(result.height).toBe(16);
   });

   test("accepts JPEGs without enlarging small stickers", async () => {
      const jpeg = await sharp({ create: { width: 20, height: 10, channels: 3, background: "red" } })
         .jpeg()
         .toBuffer();
      const result = await prepare(new Blob([new Uint8Array(jpeg)]));
      expect([result.width, result.height]).toEqual([20, 10]);
   });

   test("returns structured errors for invalid formats and corrupt files", async () => {
      for (const blob of [new Blob(), new Blob(["not an image"]), new Blob(['<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"/>'])]) {
         const result = await prepareStickerImage(blob, status);
         expect(result).toMatchObject({ code: 400, response: { code: Errors.invalidFileFormat()[1], message: Errors.invalidFileFormat()[0] } });
      }
   });
   test("returns the Huginn file-too-large error", async () => {
      const blob = new Blob([new Uint8Array(CONSTANTS.STICKER_MAX_BYTES + 1)]);
      const result = await prepareStickerImage(blob, status);
      expect(result).toMatchObject({ code: 400, response: { code: Errors.fileTooLarge(blob.size, CONSTANTS.STICKER_MAX_BYTES)[1] } });
   });
});
