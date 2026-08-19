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

export function hexToRgb(hex: string): [number, number, number] {
   const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
   return result ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)] : [0, 0, 0];
}

export function rgbToHex(r: number, g: number, b: number): string {
   return (
      "#" +
      [r, g, b]
         .map((x) => {
            const hex = Math.round(Math.max(0, Math.min(255, x))).toString(16);
            return hex.length === 1 ? "0" + hex : hex;
         })
         .join("")
   );
}

export function oklchToHex(oklch: string): string {
   const rgb = parseOklchToRgb(oklch);
   if (!rgb) return "#000000";

   const [r, g, b] = rgb;
   return rgbToHex(r, g, b);
}

export function interpolateColor(color1: string, color2: string, progress: number): string {
   const rgb1 = parseOklchToRgb(color1);
   const rgb2 = parseOklchToRgb(color2);
   if (!rgb1 || !rgb2) return "#000000"; // Fallback to black if parsing fails

   const [r1, g1, b1] = rgb1;
   const [r2, g2, b2] = rgb2;
   const r = r1 + (r2 - r1) * progress;
   const g = g1 + (g2 - g1) * progress;
   const b = b1 + (b2 - b1) * progress;
   return rgbToHex(r, g, b);
}
