import palette from "@huginn/assets/palettes.json";

import type { ColorTheme } from "../types";

export type ColorThemeType = keyof typeof palette.primary;

export const mappedColorThemes = Object.keys(palette.primary).reduce(
   (acc, key) => {
      acc[key as ColorThemeType] = {
         ...palette.primary[key as ColorThemeType],
         ...palette.semantic.caution,
         ...palette.semantic.negative,
         ...palette.semantic.positive,
         ...palette.semantic.other,
      };
      return acc;
   },
   {} as Record<ColorThemeType, ColorTheme>,
);

export function setCssColorVariables(theme: ColorTheme) {
   const style = document.documentElement.style;
   style.setProperty("--tcolor-surface", theme["surface"]);
   style.setProperty("--tcolor-surface-alt", theme["surface-alt"]);
   style.setProperty("--tcolor-surface-deep", theme["surface-deep"]);
   style.setProperty("--tcolor-surface-void", theme["surface-void"]);

   style.setProperty("--tcolor-primary-300", theme["primary-300"]);
   style.setProperty("--tcolor-primary-400", theme["primary-400"]);
   style.setProperty("--tcolor-primary-500", theme["primary-500"]);
   style.setProperty("--tcolor-primary-600", theme["primary-600"]);
   style.setProperty("--tcolor-primary-700", theme["primary-700"]);
   style.setProperty("--tcolor-primary-800", theme["primary-800"]);
   style.setProperty("--tcolor-primary-900", theme["primary-900"]);

   style.setProperty("--tcolor-positive-100", theme["positive-100"]);
   style.setProperty("--tcolor-positive-300", theme["positive-300"]);
   style.setProperty("--tcolor-positive-500", theme["positive-500"]);
   style.setProperty("--tcolor-positive-700", theme["positive-700"]);
   style.setProperty("--tcolor-positive-900", theme["positive-900"]);

   style.setProperty("--tcolor-negative-100", theme["negative-100"]);
   style.setProperty("--tcolor-negative-300", theme["negative-300"]);
   style.setProperty("--tcolor-negative-500", theme["negative-500"]);
   style.setProperty("--tcolor-negative-700", theme["negative-700"]);
   style.setProperty("--tcolor-negative-900", theme["negative-900"]);

   style.setProperty("--tcolor-caution-100", theme["caution-100"]);
   style.setProperty("--tcolor-caution-300", theme["caution-300"]);
   style.setProperty("--tcolor-caution-500", theme["caution-500"]);
   style.setProperty("--tcolor-caution-700", theme["caution-700"]);
   style.setProperty("--tcolor-caution-900", theme["caution-900"]);

   style.setProperty("--tcolor-text", theme.text);
}
