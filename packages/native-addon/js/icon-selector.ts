import path from "path";

type ContrastType = "standard" | "high" | "black" | "white";
type ThemeType = "light" | "dark";
type AltformType = "unplated" | "lightunplated" | "darkunplated";

interface ResourceQualifiers {
   scale?: number;
   contrast?: ContrastType;
   theme?: ThemeType;
   targetsize?: number;
   altform?: AltformType;
}

interface IconCandidate {
   path: string;
   qualifiers: ResourceQualifiers;
   score: number;
}

interface IconSelectionOptions {
   targetSize?: number;
   systemScale?: number;
   systemTheme?: ThemeType;
   systemContrast?: ContrastType;
   preferredAltForm?: AltformType;
}

export function selectBestIcon(iconPaths: string[], options: IconSelectionOptions = {}) {
   const opts = { ...DEFAULT_OPTIONS, ...options };
   const parsedIcons: IconCandidate[] = iconPaths.map((iconPath) => ({
      path: iconPath,
      qualifiers: parseQualifiers(iconPath),
      score: 0,
   }));

   for (const icon of parsedIcons) {
      icon.score = calculateIconScore(icon.qualifiers, opts);
   }

   parsedIcons.sort((a, b) => b.score - a.score);
   const bestIcon = parsedIcons[0]!;

   return bestIcon.path;
}

function parseQualifiers(iconPath: string) {
   const qualifiers: ResourceQualifiers = {};
   const filename = path.basename(iconPath);

   const segments = filename.split(".");
   const qualifierSegments = segments[1]?.split("_");

   const patterns = {
      scale: /^scale-(\d+)$/i,
      contrast: /^contrast-(standard|high|black|white)$/i,
      theme: /^theme-(light|dark)$/i,
      targetsize: /^targetsize-(\d+)$/i,
      altform: /^altform-(unplated|lightunplated|darkunplated)$/i,
   } as const;

   if (!qualifierSegments) {
      return qualifiers;
   }

   // Extract qualifiers
   for (const segment of qualifierSegments) {
      for (const [key, pattern] of Object.entries(patterns)) {
         const match = segment.match(pattern);
         if (match) {
            const value = match[1]!;

            switch (key as keyof typeof patterns) {
               case "scale":
               case "targetsize":
                  (qualifiers as any)[key] = parseInt(value, 10);
                  break;
               case "contrast":
                  qualifiers.contrast = value as ContrastType;
                  break;
               case "theme":
                  qualifiers.theme = value as ThemeType;
                  break;
               case "altform":
                  qualifiers.altform = value as AltformType;
            }
         }
      }
   }

   return qualifiers;
}

const DEFAULT_OPTIONS: Required<IconSelectionOptions> = {
   targetSize: 48,
   systemScale: 100,
   systemTheme: "dark",
   preferredAltForm: "unplated",
   systemContrast: "standard",
};

function calculateIconScore(qualifiers: ResourceQualifiers, options: Required<IconSelectionOptions>): number {
   let score = 0;

   // Scale matching (highest priority - up to 100 points)
   if (qualifiers.scale !== undefined) {
      const scaleDiff = Math.abs(qualifiers.scale - options.systemScale);
      score += Math.max(0, 100 - scaleDiff);
   } else {
      // Neutral score for no scale specified (assumes scale-100)
      score += Math.max(0, 100 - Math.abs(100 - options.systemScale));
   }

   // Target size matching (up to 50 points)
   if (qualifiers.targetsize !== undefined) {
      const sizeDiff = Math.abs(qualifiers.targetsize - options.targetSize);
      score += Math.max(0, 50 - sizeDiff * 2);
   }

   // Theme matching (up to 30 points)
   if (qualifiers.theme === options.systemTheme) {
      score += 30;
   } else if (qualifiers.theme === undefined) {
      score += 15; // Neutral theme gets some points
   }

   // Contrast matching (up to 25 points)
   if (qualifiers.contrast === options.systemContrast) {
      score += 25;
   } else if (qualifiers.contrast === undefined && options.systemContrast === "standard") {
      score += 20; // Unspecified contrast defaults to standard
   }

   if (qualifiers.altform === options.preferredAltForm) {
      score += 20;
   } else if (qualifiers.altform === undefined) {
      // Default behavior: no altform specified usually means "plated"
      // Give points if we prefer unplated but this could be plated
      score += options.preferredAltForm === "unplated" ? 5 : 15;
   } else {
      // Penalize mismatched altforms since they have different visual appearances
      score -= 10;
   }

   // Bonus for unqualified icons (good fallbacks)
   if (Object.keys(qualifiers).length === 0) {
      score += 5;
   }

   return Math.max(0, score);
}
