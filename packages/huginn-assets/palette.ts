import { inGamut } from "culori";

type ColorScale = Record<string, string>;

const OUT = "./palettes.json";

// ---------------------------------------------------------------------------
// Gamut helpers
// ---------------------------------------------------------------------------

/** Binary-searches the largest in-gamut (sRGB) chroma for a given lightness/hue. */
function maxChroma(l: number, h: number): number {
   let lo = 0;
   let hi = 0.4;
   for (let i = 0; i < 20; i++) {
      const mid = (lo + hi) / 2;
      const inRange = inGamut("rgb")({ mode: "oklch", l, c: mid, h });
      if (inRange) lo = mid;
      else hi = mid;
   }
   return lo;
}

function oklch(l: number, c: number, h: number): string {
   return `oklch(${l} ${c.toFixed(3)} ${h})`;
}

// ---------------------------------------------------------------------------
// Semantic scales — positive / negative / caution
// These share one chroma ceiling so all three feel equally saturated,
// since they can appear together in the UI (e.g. status badges).
// Steps run 100 -> 900.
// ---------------------------------------------------------------------------

const SEMANTIC_STEPS = [100, 300, 500, 700, 900] as const;
const SEMANTIC_LIGHTNESS = [0.85, 0.735, 0.625, 0.51, 0.4];

const SEMANTIC_HUES = {
   positive: 145,
   negative: 30,
   caution: 70,
} as const;

const OTHER_SEMANTIC_COLORS = {
   surface: oklch(0.31, 0, 0),
   "surface-alt": oklch(0.27, 0, 0),
   "surface-deep": oklch(0.23, 0, 0),
   text: oklch(0.93, 0.032, 107),
};

function buildSemanticScale(name: string, hue: number, targetChroma: number): ColorScale {
   const scale: ColorScale = {};
   SEMANTIC_STEPS.forEach((step, i) => {
      const l = SEMANTIC_LIGHTNESS[i];
      const c = Math.min(targetChroma, maxChroma(l, hue));
      scale[`${name}-${step}`] = oklch(l, c, hue);
   });
   return scale;
}

function buildSemanticPalette(): Record<string, ColorScale> {
   // Shared ceiling, measured at the base (500) lightness — the tightest
   // hue's gamut caps the chroma used by all three scales.
   const baseLightness = SEMANTIC_LIGHTNESS[Math.floor(SEMANTIC_STEPS.length / 2)];
   const ceilings = Object.values(SEMANTIC_HUES).map((hue) => maxChroma(baseLightness, hue));
   const sharedChroma = Math.min(...ceilings);

   const palette: Record<string, ColorScale> = {};
   for (const [name, hue] of Object.entries(SEMANTIC_HUES)) {
      palette[name] = buildSemanticScale(name, hue, sharedChroma);
   }

   palette["other"] = {};
   for (const [name, color] of Object.entries(OTHER_SEMANTIC_COLORS)) {
      palette["other"][name] = color;
   }
   return palette;
}

// ---------------------------------------------------------------------------
// Primary scales — one independent palette per theme hue
// These are never shown together (user picks one theme), so each hue
// gets its own saturation fraction (k) instead of a shared ceiling.
// Steps run 300 -> 900.
// ---------------------------------------------------------------------------

const PRIMARY_STEPS = [300, 400, 500, 600, 700, 800, 900] as const;
const PRIMARY_LIGHTNESS = [0.8, 0.725, 0.65, 0.575, 0.5, 0.425, 0.35];
const PRIMARY_HUES = [
   { name: "cerulean", value: 240 },
   { name: "pine-green", value: 159 },
   { name: "plum", value: 355 },
   { name: "coffee", value: 45 },
   { name: "violet", value: 300 },
   { name: "rose", value: 20 },
];

/** Fraction of the gamut ceiling to target, tuned per hue family. */
function kForHue(h: number): number {
   if (h < 40 || h >= 330) return 0.8; // red
   if (h < 90) return 0.6; // orange/yellow
   if (h < 160) return 0.6; // yellow-green/green
   if (h < 250) return 0.85; // cyan/blue
   return 0.7; // purple/magenta
}

function buildPrimaryScale(hue: number): ColorScale {
   const scale: ColorScale = {};
   const k = kForHue(hue);
   PRIMARY_STEPS.forEach((step, i) => {
      const l = PRIMARY_LIGHTNESS[i];
      const c = k * maxChroma(l, hue);
      scale[`primary-${step}`] = oklch(l, c, hue);
   });
   return scale;
}

function buildPrimaryPalettes(): Record<string, ColorScale> {
   const palettes: Record<string, ColorScale> = {};
   for (const hue of PRIMARY_HUES) {
      palettes[hue.name] = buildPrimaryScale(hue.value);
   }
   return palettes;
}

// ---------------------------------------------------------------------------
// Output
// ---------------------------------------------------------------------------

const palettes = {
   semantic: buildSemanticPalette(),
   primary: buildPrimaryPalettes(),
};

await Bun.write(Bun.file(OUT), JSON.stringify(palettes, null, 2));
