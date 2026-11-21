import { applyPalette, GIFEncoder, quantize } from "gifenc";

// The frame task sent by gif.js, which super-image-cropper uses to run its workers.
export interface GifFrameTask {
   data: Uint8Array | Uint8ClampedArray;
   width: number;
   height: number;
   index: number;
   last: boolean;
   delay: number;
   repeat: number;
   canTransfer: boolean;
}

export function encodeGifFrame(frame: GifFrameTask) {
   const { data, width, height } = frame;
   let opaqueCount = 0;
   for (let i = 3; i < data.length; i += 4) {
      if (data[i] >= 128) opaqueCount++;
   }

   // Quantize only opaque pixels. Reserve index 0 for transparency instead of
   // making an RGB color (such as black) transparent. GIF has one-bit alpha.
   const opaque = new Uint8Array(opaqueCount * 4);
   let offset = 0;
   for (let i = 0; i < data.length; i += 4) {
      if (data[i + 3] < 128) continue;
      opaque.set(data.subarray(i, i + 4), offset);
      opaque[offset + 3] = 255;
      offset += 4;
   }

   const palette = opaqueCount ? quantize(opaque, 255) : [[0, 0, 0]];
   const mapped = opaqueCount ? applyPalette(opaque, palette) : new Uint8Array();
   const pixels = new Uint8Array(width * height);
   offset = 0;
   for (let i = 0; i < pixels.length; i++) {
      if (data[i * 4 + 3] >= 128) pixels[i] = mapped[offset++] + 1;
   }
   palette.unshift([0, 0, 0]);

   // Each worker returns one independently encoded chunk. gif.js assembles
   // these in frame order, so only the first/last chunks carry the header/trailer.
   const gif = GIFEncoder({ auto: false });
   if (frame.index === 0) gif.writeHeader();
   gif.writeFrame(pixels, width, height, {
      first: frame.index === 0,
      palette,
      transparent: true,
      transparentIndex: 0,
      dispose: 2,
      delay: frame.delay,
      repeat: frame.repeat,
   });
   if (frame.last) gif.finish();

   const bytes = gif.bytes();
   return { index: frame.index, data: [bytes], cursor: bytes.length, pageSize: bytes.length };
}
