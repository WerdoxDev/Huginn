import type { EmojiMapMeta, EmojiPosition } from "@huginnjs/shared";

import fs from "fs/promises";
import path from "path";
import sharp, { type OverlayOptions } from "sharp";

type EmojiMap = {
   meta: EmojiMapMeta;
   emojis: Record<string, EmojiPosition>;
};

type GenerateSpriteOptions = {
   /** Directory of source PNGs named by codepoint (e.g. 1f600.png). Default: `"./pngs"` */
   input?: string;
   /** Directory to write output files into. Default: `"./out"` */
   output?: string;
   /** Pixel size of each emoji cell. Default: `64` */
   size?: number;
   /** Number of emoji columns per row. Default: `42` */
   cols?: number;
   /** Pixel gap around each cell (prevents bleed). Default: `0` */
   padding?: number;
   /** WebP quality (1–100). Default: `90` */
   quality?: number;
   /** Use lossless WebP encoding. Default: `false` */
   lossless?: boolean;
};

type GenerateSpriteResult = {
   /** Absolute path to the written `emoji-sheet.webp` */
   webpPath: string;
   /** The full position map (meta + per-emoji coords) */
   emojiMap: EmojiMap;
};

sharp.concurrency(0);

export async function generateEmojiSprite(options: GenerateSpriteOptions = {}): Promise<GenerateSpriteResult> {
   const { input = "./pngs", output = "./out", size = 64, cols = 42, padding = 0, quality = 90, lossless = false } = options;

   const CELL = size;
   const COLS = cols;
   const PAD = padding;
   const STEP = CELL + PAD * 2;

   const INPUT = path.resolve(input);
   const OUTPUT = path.resolve(output);

   await fs.mkdir(OUTPUT, { recursive: true });

   const files = (await fs.readdir(INPUT)).filter((f) => f.endsWith(".png")).sort();
   if (files.length === 0) throw new Error(`No PNG files found in ${INPUT}`);

   const ROWS = Math.ceil(files.length / COLS);
   const SHEET_WIDTH = COLS * STEP;
   const SHEET_HEIGHT = ROWS * STEP;

   // ── 1. Resize all emoji into buffers in parallel ──────────────────────────

   console.log(`Resizing ${files.length} emoji...`);

   const resized = await Promise.all(
      files.map((file) => {
         return sharp(path.join(INPUT, file))
            .resize(CELL, CELL, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
            .ensureAlpha()
            .raw() // raw RGBA — no encode/decode overhead between steps
            .toBuffer({ resolveWithObject: true });
      }),
   );

   // ── 2. Composite one strip (row) at a time, in parallel ───────────────────

   console.log(`Compositing ${ROWS} strips...`);

   const STRIP_CONCURRENCY = 8; // tune to your core count
   const stripBuffers: Buffer[] = Array.from({ length: ROWS });

   for (let rowStart = 0; rowStart < ROWS; rowStart += STRIP_CONCURRENCY) {
      const rowBatch = Array.from({ length: Math.min(STRIP_CONCURRENCY, ROWS - rowStart) }, (_, i) => rowStart + i);

      await Promise.allSettled(
         rowBatch.map(async (row) => {
            const rowComposites: OverlayOptions[] = [];

            for (let col = 0; col < COLS; col++) {
               const i = row * COLS + col;
               if (i >= files.length) break;

               const { data, info } = resized[i];

               rowComposites.push({
                  input: data,
                  raw: { width: info.width, height: info.height, channels: info.channels as 1 | 2 | 3 | 4 },
                  left: col * STEP + PAD,
                  top: PAD, // always 0+PAD within the strip
               });
            }

            stripBuffers[row] = await sharp({
               create: {
                  width: SHEET_WIDTH,
                  height: STEP, // single row height
                  channels: 4,
                  background: { r: 0, g: 0, b: 0, alpha: 0 },
               },
            })
               .composite(rowComposites)
               .raw() // stay raw — avoid intermediate webp encode
               .toBuffer();
         }),
      );
   }

   // ── 3. Stack strips into the final image ──────────────────────────────────

   console.log(`Stitching ${ROWS} strips into final sheet...`);

   const stripComposites: OverlayOptions[] = stripBuffers.map((buf, row) => ({
      input: buf,
      raw: { width: SHEET_WIDTH, height: STEP, channels: 4 },
      left: 0,
      top: row * STEP,
   }));

   const webpPath = path.join(OUTPUT, "emoji-sheet.webp");

   await sharp({
      create: { width: SHEET_WIDTH, height: SHEET_HEIGHT, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
   })
      .composite(stripComposites) // only ROWS composites here (~100), not 4000
      .webp({ quality, lossless })
      .toFile(webpPath);

   // ── Position map ──────────────────────────────────────────────────────────

   const positionMap: Record<string, EmojiPosition> = {};
   files.forEach((file, i) => {
      const codepoint = path.basename(file, ".png").toLowerCase();
      const col = i % COLS;
      const row = Math.floor(i / COLS);
      positionMap[codepoint] = { x: col * STEP + PAD, y: row * STEP + PAD, row, col };
   });

   const emojiMap: EmojiMap = {
      meta: {
         cellSize: CELL,
         padding: PAD,
         step: STEP,
         cols: COLS,
         rows: ROWS,
         sheetWidth: SHEET_WIDTH,
         sheetHeight: SHEET_HEIGHT,
         count: files.length,
      },
      emojis: positionMap,
   };

   console.log(`Done: ${webpPath}`);
   return { webpPath, emojiMap };
}
