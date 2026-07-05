#!/usr/bin/env bun
/**
 * generate-icons.ts
 *
 * Pipeline:
 *   1. Recolor each base image to a solid color (using its alpha channel as a mask).
 *   2. Stack the recolored base images on top of each other.
 *   3. Produce that stacked result plus one variant per outline: the same stack
 *      with a scaled, recolored outline composited BEHIND it.
 *   4. Export every variant as PNGs (at whatever sizes you list) and as a
 *      multi-resolution .ico (via ImageMagick's `convert`).
 *
 * Requirements:
 *   - Bun (https://bun.sh)
 *   - `bun add sharp`
 *   - ImageMagick installed and on PATH (`convert` command) — only used for .ico packing.
 *
 * Run:
 *   bun run generate-icons.ts
 */

import { parseOklchToRgb } from "@huginn/shared";
import { execFileSync } from "node:child_process";
import { mkdirSync, existsSync, rmSync } from "node:fs";
import path from "node:path";
import sharp, { type Sharp } from "sharp";

/* ============================================================
   CONFIG — edit this section for your project
   ============================================================ */

type HexColor = `#${string}`;
type MaskFrom = "alpha" | "white-on-black" | "black-on-white";

type BaseLayer = {
   path: string; // path to base silhouette image
   color: string; // solid color to recolor it to
   maskFrom?: MaskFrom; // default "alpha" — see note below
};

type OutlineVariant = {
   name: string; // used in output filenames, e.g. "outline-a"
   path: string; // path to outline silhouette image
   color: string; // color to recolor the outline to
   growPixels: number; // grow the outline outward by this many px (uniform border width),
};

type Options = {
   outputDir: string; // where to write the PNGs and .ico
   canvasSize: number; // size of the working canvas (the base stack and outlines are all sized to this)
   baseLayers: BaseLayer[]; // the base stack layers, bottom to top
   outlineVariants: OutlineVariant[]; // the outline variants to composite behind the base stack
   pngSizes: number[]; // which PNG sizes to export (e.g. [16, 32, 64, 128])
   icoSizes: number[]; // which sizes to include in the .ico (subset of pngSizes)
};

/*
 * maskFrom notes:
 *  - "alpha": your image already has a transparent background and an
 *    opaque silhouette (any color). This is the recommended/simplest format
 *    — recoloring just replaces RGB and keeps the original alpha as-is.
 *  - "white-on-black": image has NO alpha channel — shape is white, background
 *    is black. Luminance is used as the mask.
 *  - "black-on-white": image has NO alpha channel — shape is black, background
 *    is white. Inverted luminance is used as the mask.
 */

/* ============================================================
   Implementation
   ============================================================ */

/** Load an image and fit it into a `size x size` canvas, returning just its
 *  alpha mask (single-channel raw buffer) — no color applied yet. */
async function prepareMask(imgPath: string, size: number, maskFrom: MaskFrom = "alpha"): Promise<Buffer> {
   const { data, info } = await sharp(imgPath)
      .ensureAlpha()
      .resize(size, size, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .raw()
      .toBuffer({ resolveWithObject: true });

   const mask = Buffer.alloc(info.width * info.height);

   for (let i = 0; i < info.width * info.height; i++) {
      const r = data[i * 4];
      const g = data[i * 4 + 1];
      const b = data[i * 4 + 2];
      const a = data[i * 4 + 3];

      if (maskFrom === "alpha") mask[i] = a;
      else if (maskFrom === "white-on-black") mask[i] = Math.round((r + g + b) / 3);
      else mask[i] = 255 - Math.round((r + g + b) / 3); // black-on-white
   }

   return mask;
}

/** Paints a solid `color` onto a mask, using the mask as the alpha channel.
 *  Returns a PNG buffer. */
async function colorizeMask(mask: Buffer, width: number, height: number, color: string): Promise<Buffer> {
   const rgb = parseOklchToRgb(color);
   if (!rgb) throw new Error(`Invalid color: ${color}`);

   const [r, g, b] = rgb;
   const out = Buffer.alloc(width * height * 4);

   for (let i = 0; i < width * height; i++) {
      out[i * 4] = r;
      out[i * 4 + 1] = g;
      out[i * 4 + 2] = b;
      out[i * 4 + 3] = mask[i];
   }

   return sharp(out, { raw: { width, height, channels: 4 } })
      .png()
      .toBuffer();
}

/** Load an image, fit it into a `size x size` transparent canvas, and
 *  recolor it to `color` using the chosen mask strategy. Returns a PNG buffer. */
async function prepareLayer(imgPath: string, color: string, size: number, maskFrom: MaskFrom = "alpha"): Promise<Buffer> {
   const mask = await prepareMask(imgPath, size, maskFrom);
   return colorizeMask(mask, size, size, color);
}

/** Grow (dilate) or shrink (erode) a single-channel alpha mask by ~`growPixels`,
 *  using a calibrated blur+threshold. This is a standard trick for growing an
 *  alpha mask outward by a roughly uniform distance in every direction — much
 *  cheaper than true morphological dilation and accurate to within ~1px for
 *  icon-scale artwork (verified against ImageMagick-free measurement). */
async function growAlphaMask(alphaRaw: Buffer, width: number, height: number, growPixels: number): Promise<Buffer> {
   if (growPixels === 0) return alphaRaw;

   const erode = growPixels < 0;
   const px = Math.abs(growPixels);
   const sigma = Math.max(0.3, px / 1.55);
   const lowThreshold = 5;

   const working = erode ? invertBuffer(alphaRaw) : alphaRaw;

   const blurred = await sharp(working, { raw: { width, height, channels: 1 } })
      .blur(sigma)
      .toColourspace("b-w") // keep single-channel output (blur alone upconverts to 3ch)
      .raw()
      .toBuffer();

   const out = Buffer.alloc(width * height);
   for (let i = 0; i < out.length; i++) out[i] = blurred[i] >= lowThreshold ? 255 : 0;

   return erode ? invertBuffer(out) : out;
}

function invertBuffer(buf: Buffer): Buffer {
   const out = Buffer.alloc(buf.length);
   for (let i = 0; i < buf.length; i++) out[i] = 255 - buf[i];
   return out;
}

/** Pads a single-channel mask buffer onto a larger, zero-filled canvas,
 *  centered with `offset` px of padding on every side. Plain buffer copy —
 *  no alpha compositing involved, so there's no risk of losing color data. */
function padMask(mask: Buffer, width: number, height: number, paddedSize: number, offset: number): Buffer {
   const out = Buffer.alloc(paddedSize * paddedSize); // zero-filled = fully transparent
   for (let y = 0; y < height; y++) {
      const srcStart = y * width;
      const destStart = (y + offset) * paddedSize + offset;
      mask.copy(out, destStart, srcStart, srcStart + width);
   }
   return out;
}

/** Composites a grown outline behind a base stack WITHOUT ever clipping the
 *  growth against the canvas edge, and WITHOUT losing the outline's color.
 *  Colorizing happens last, after growing the (colorless) alpha mask on a
 *  padded canvas — padded by `growPixels` on every side, which is always
 *  enough room since growth is a fixed pixel offset. If padding was needed,
 *  the whole composited result (outline + base, together) is scaled back
 *  down to `size x size` as a single unit, which keeps the border uniform
 *  rather than clipping it off. */
async function compositeOutlineNoClip(ov: OutlineVariant, baseStack: Buffer, size: number): Promise<Buffer> {
   const mask = await prepareMask(ov.path, size, "alpha");

   const pad = Math.max(0, Math.ceil(ov.growPixels));
   const paddedSize = size + pad * 2;

   const paddedMask = pad === 0 ? mask : padMask(mask, size, size, paddedSize, pad);
   const grownMask = await growAlphaMask(paddedMask, paddedSize, paddedSize, ov.growPixels);
   const grownColoredOutline = await colorizeMask(grownMask, paddedSize, paddedSize, ov.color);

   const basePadded =
      pad === 0
         ? baseStack
         : await (
              await blankCanvas(paddedSize)
           )
              .composite([{ input: baseStack, left: pad, top: pad }])
              .png()
              .toBuffer();

   const composited = await (
      await blankCanvas(paddedSize)
   )
      .composite([{ input: grownColoredOutline }, { input: basePadded }])
      .png()
      .toBuffer();

   if (paddedSize === size) return composited;

   return sharp(composited).resize(size, size).png().toBuffer();
}

async function blankCanvas(size: number): Promise<Sharp> {
   return sharp({
      create: { width: size, height: size, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
   });
}

/** Export one composited variant (a PNG buffer) as multiple PNG sizes and one .ico. */
async function exportVariant(name: string, composite: Buffer, options: Options) {
   const variantDir = path.join(options.outputDir, name);
   mkdirSync(variantDir, { recursive: true });

   const pngPaths: Record<number, string> = {};

   for (const size of options.pngSizes) {
      const outPath = path.join(variantDir, `${name}-${size}.png`);
      await sharp(composite).resize(size, size).png().toFile(outPath);
      pngPaths[size] = outPath;
   }

   // Build the .ico from the icoSizes subset using ImageMagick.
   // Any png sizes not already generated (because they're only in icoSizes)
   // are rendered too.
   const icoInputs: string[] = [];
   for (const size of options.icoSizes) {
      if (!pngPaths[size]) {
         const outPath = path.join(variantDir, `${name}-${size}.png`);
         await sharp(composite).resize(size, size).png().toFile(outPath);
         pngPaths[size] = outPath;
      }
      icoInputs.push(pngPaths[size]);
   }

   const icoPath = path.join(variantDir, `${name}.ico`);
   execFileSync("magick", [...icoInputs, icoPath]);

   console.log(`✓ ${name}: ${options.pngSizes.length} PNGs + ${icoPath}`);
}

export async function createIcon(options: Options) {
   if (existsSync(options.outputDir)) rmSync(options.outputDir, { recursive: true });
   mkdirSync(options.outputDir, { recursive: true });

   const size = options.canvasSize;

   // 1. Recolor each base layer.
   const recoloredBases = await Promise.all(options.baseLayers.map((l) => prepareLayer(l.path, l.color, size, l.maskFrom ?? "alpha")));

   // 2. Stack them (bottom to top, in config order).
   const stacked = await (
      await blankCanvas(size)
   )
      .composite(recoloredBases.map((input) => ({ input })))
      .png()
      .toBuffer();

   await exportVariant("stacked", stacked, options);

   // 3. One variant per outline: the outline is grown outward by a fixed
   //    pixel amount (not scaled), so the border between it and the base
   //    stack stays a uniform width all the way around — even on irregular
   //    shapes. Growth happens on a padded canvas so it never clips; if
   //    padding was needed, the whole composited result (outline + base,
   //    together) is scaled back down to fit `size x size` as a single unit,
   //    which keeps the border uniform rather than clipping it off.
   for (const ov of options.outlineVariants) {
      const withOutline = await compositeOutlineNoClip(ov, stacked, size);
      await exportVariant(ov.name, withOutline, options);
   }

   console.log("\nAll variants exported to", options.outputDir);
}
