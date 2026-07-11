import type { ThemeType } from "@huginn/shared";

import { useStorage } from "@stores/storageStore";
import { createContext, type ReactNode, useLayoutEffect } from "react";
import { createStore, useStore } from "zustand";
import { combine } from "zustand/middleware";

import type { ColorTheme } from "@/types";

import * as palette from "@/assets/palettes.json";

export const mappedColorThemes: Record<ThemeType, ColorTheme> = Object.keys(palette.primary).reduce(
   (acc, key) => {
      acc[key as ThemeType] = {
         ...palette.primary[key as keyof typeof palette.primary],
         ...palette.semantic.caution,
         ...palette.semantic.negative,
         ...palette.semantic.positive,
         ...palette.semantic.other,
      } as ColorTheme;
      return acc;
   },
   {} as Record<ThemeType, ColorTheme>,
);

const store = createStore(
   combine(
      {
         themeType: "pine-green" as ThemeType,
         theme: mappedColorThemes["pine-green"],
      },
      (set) => ({
         setTheme: (type: ThemeType) =>
            set(() => {
               const theme = mappedColorThemes[type];
               setColorProperty(theme);
               return { themeType: type, theme: theme };
            }),
      }),
   ),
);

const ThemeContext = createContext<typeof store>({} as typeof store);

export function ThemeProvider(props: { children?: ReactNode }) {
   const settings = useStorage("settings");

   useLayoutEffect(() => {
      store.getState().setTheme(settings.theme);
   }, [settings.theme]);

   return <ThemeContext.Provider value={store}>{props.children}</ThemeContext.Provider>;
}

function setColorProperty(theme: ColorTheme) {
   const style = document.documentElement.style;
   style.setProperty("--tcolor-surface", theme["surface"]);
   style.setProperty("--tcolor-surface-alt", theme["surface-alt"]);
   style.setProperty("--tcolor-surface-deep", theme["surface-deep"]);

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

export function useTheme() {
   return useStore(store);
}

export const themeStore = store;
