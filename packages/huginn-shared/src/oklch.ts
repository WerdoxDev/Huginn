function oklchToRgb(L: number, C: number, H: number) {
   // --- 1. OKLCH -> OKLab ---
   const hRad = (H * Math.PI) / 180;
   const a = C * Math.cos(hRad);
   const b = C * Math.sin(hRad);

   // --- 2. OKLab -> linear sRGB (Björn Ottosson's matrices) ---
   const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
   const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
   const s_ = L - 0.0894841775 * a - 1.291485548 * b;

   const l = l_ ** 3;
   const m = m_ ** 3;
   const s = s_ ** 3;

   let rLin = +4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s;
   let gLin = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s;
   let bLin = -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s;

   // --- 3. Linear sRGB -> gamma-corrected sRGB ---
   const toSrgb = (c: number) => {
      const clamped = Math.min(Math.max(c, 0), 1);
      return clamped <= 0.0031308 ? 12.92 * clamped : 1.055 * Math.pow(clamped, 1 / 2.4) - 0.055;
   };

   rLin = toSrgb(rLin);
   gLin = toSrgb(gLin);
   bLin = toSrgb(bLin);

   // --- 4. Scale to 0–255 and round ---
   const toByte = (c: number) => Math.round(Math.min(Math.max(c, 0), 1) * 255);

   return {
      r: toByte(rLin),
      g: toByte(gLin),
      b: toByte(bLin),
   };
}

function parseOklch(str: string) {
   const match = str.trim().match(/^oklch\(\s*([\d.]+%?)\s+([\d.]+)\s+([\d.]+)(?:deg)?\s*(?:\/\s*([\d.]+%?))?\s*\)$/i);

   if (!match) {
      throw new Error(`Invalid oklch() string: "${str}"`);
   }

   const [, lRaw, cRaw, hRaw, alphaRaw] = match;

   const L = lRaw.endsWith("%") ? parseFloat(lRaw) / 100 : parseFloat(lRaw);
   const C = parseFloat(cRaw);
   const H = parseFloat(hRaw);
   const alpha = alphaRaw ? (alphaRaw.endsWith("%") ? parseFloat(alphaRaw) / 100 : parseFloat(alphaRaw)) : 1;

   return { L, C, H, alpha };
}

export function parseOklchToRgb(str: string): [number, number, number, number] | null {
   const { L, C, H, alpha } = parseOklch(str);
   const { r, g, b } = oklchToRgb(L, C, H);
   return [r, g, b, alpha];
}
