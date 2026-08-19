import { createIcon } from "./generate-icons";
import * as palettes from "./palettes.json";

async function main() {
   const modifiedPalettes = {
      ...palettes,
      primary: { ...palettes.primary, default: { "primary-500": palettes.semantic.other.text, "primary-700": "oklch(0.687 0.032 107)" } },
   };
   for (const theme of Object.keys(modifiedPalettes.primary)) {
      const palette = modifiedPalettes.primary[theme as keyof typeof modifiedPalettes.primary];

      await createIcon({
         outputDir: `./icon-out/${theme}`,
         canvasSize: 2048,
         icoSizes: [512],
         pngSizes: [512],

         baseLayers: [
            { path: "./icon-input/outline.png", color: palettes.semantic.other["surface-deep"] },
            { path: "./icon-input/body.png", color: palette["primary-500"] },
            { path: "./icon-input/shadow.png", color: palette["primary-700"] },
         ],
         stackVariants: [
            {
               name: "android-notification",
               layers: [
                  { path: "./icon-input/body.png", color: "oklch(1 0 0)", opacity: 1 },
                  { path: "./icon-input/shadow.png", color: "oklch(1 0 0)", opacity: 0.4 },
                  { path: "./icon-input/outline.png", color: "oklch(1 0 0)", opacity: 0 },
               ],
            },
         ],
         outlineVariants: [
            { name: "outline", path: "./icon-input/outline.png", color: palette["primary-500"], growPixels: 64 },
            { name: "outline-thick", path: "./icon-input/outline.png", color: palette["primary-500"], growPixels: 128 },
            {
               name: "android-notification-outline",
               path: "./icon-input/outline.png",
               color: "oklch(1 0 0)",
               growPixels: 64,
               stack: "android-notification",
               ringOnly: true,
            },
            {
               name: "android-notification-outline-thick",
               path: "./icon-input/outline.png",
               color: "oklch(1 0 0)",
               growPixels: 128,
               stack: "android-notification",
               ringOnly: true,
            },
         ],
      });
   }
}

await main();
