import { useFilesStore } from "@stores/filesStore";
import { createContext, type ReactNode, useLayoutEffect } from "react";
import { createStore, useStore } from "zustand";
import { combine } from "zustand/middleware";
import type { ColorTheme, ThemeType } from "@/types";

export const ceruleanTheme: ColorTheme = {
   surface: "#303030",
   "surface-alt": "#262626",
   "surface-deep": "#1f1f1f",
   "primary-300": "#57ecff",
   "primary-400": "#0cd7ff",
   "primary-500": "#00bbea",
   "primary-600": "#0093c4",
   "primary-700": "#007ba7",
   "primary-800": "#0b5d7f",
   "primary-900": "#0e4e6b",
   "positive-100": "#76ff7a",
   "positive-200": "#6ae66e",
   "positive-300": "#5ecc62",
   "positive-400": "#53b355",
   "positive-500": "#479949",
   "positive-600": "#3b803d",
   "positive-700": "#2f6631",
   "positive-800": "#234c25",
   "positive-900": "#183318",
   "negative-100": "#fa8072",
   "negative-200": "#e17367",
   "negative-300": "#c8665b",
   "negative-400": "#af5a50",
   "negative-500": "#964d44",
   "negative-600": "#7d4039",
   "negative-700": "#64332e",
   "negative-800": "#4b2622",
   "negative-900": "#321a17",
   "caution-100": "#ed9121",
   "caution-200": "#d5831e",
   "caution-300": "#be741a",
   "caution-400": "#a66617",
   "caution-500": "#8e5714",
   "caution-600": "#774911",
   "caution-700": "#5f3a0d",
   "caution-800": "#472b0a",
   "caution-900": "#2f1d07",
   text: "#EBEBD3",
};

export const pineGreenTheme: ColorTheme = {
   surface: "#303030",
   "surface-alt": "#262626",
   "surface-deep": "#1f1f1f",
   "primary-300": "#4afedd",
   "primary-400": "#15eccb",
   "primary-500": "#00dabd",
   "primary-600": "#00a893",
   "primary-700": "#008c7d",
   "primary-800": "#066960",
   "primary-900": "#075a53",
   "positive-100": "#76ff7a",
   "positive-200": "#6ae66e",
   "positive-300": "#5ecc62",
   "positive-400": "#53b355",
   "positive-500": "#479949",
   "positive-600": "#3b803d",
   "positive-700": "#2f6631",
   "positive-800": "#234c25",
   "positive-900": "#183318",
   "negative-100": "#fa8072",
   "negative-200": "#e17367",
   "negative-300": "#c8665b",
   "negative-400": "#af5a50",
   "negative-500": "#964d44",
   "negative-600": "#7d4039",
   "negative-700": "#64332e",
   "negative-800": "#4b2622",
   "negative-900": "#321a17",
   "caution-100": "#ed9121",
   "caution-200": "#d5831e",
   "caution-300": "#be741a",
   "caution-400": "#a66617",
   "caution-500": "#8e5714",
   "caution-600": "#774911",
   "caution-700": "#5f3a0d",
   "caution-800": "#472b0a",
   "caution-900": "#2f1d07",
   text: "#EBEBD3",
};

export const eggplantTheme: ColorTheme = {
   surface: "#303030",
   "surface-alt": "#262626",
   "surface-deep": "#1f1f1f",
   "primary-300": "#dbc6ce",
   "primary-400": "#c5a1af",
   "primary-500": "#b08494",
   "primary-600": "#996977",
   "primary-700": "#7C515D",
   "primary-800": "#6c4851",
   "primary-900": "#5c3f47",
   "positive-100": "#76ff7a",
   "positive-200": "#6ae66e",
   "positive-300": "#5ecc62",
   "positive-400": "#53b355",
   "positive-500": "#479949",
   "positive-600": "#3b803d",
   "positive-700": "#2f6631",
   "positive-800": "#234c25",
   "positive-900": "#183318",
   "negative-100": "#fa8072",
   "negative-200": "#e17367",
   "negative-300": "#c8665b",
   "negative-400": "#af5a50",
   "negative-500": "#964d44",
   "negative-600": "#7d4039",
   "negative-700": "#64332e",
   "negative-800": "#4b2622",
   "negative-900": "#321a17",
   "caution-100": "#ed9121",
   "caution-200": "#d5831e",
   "caution-300": "#be741a",
   "caution-400": "#a66617",
   "caution-500": "#8e5714",
   "caution-600": "#774911",
   "caution-700": "#5f3a0d",
   "caution-800": "#472b0a",
   "caution-900": "#2f1d07",
   text: "#EBEBD3",
};

export const coffeeTheme: ColorTheme = {
   surface: "#303030",
   "surface-alt": "#262626",
   "surface-deep": "#1f1f1f",
   "primary-300": "#c4ad80",
   "primary-400": "#b3915c",
   "primary-500": "#a3804f",
   "primary-600": "#8c6742",
   "primary-700": "#7b563c",
   "primary-800": "#604333",
   "primary-900": "#533b30",
   "positive-100": "#76ff7a",
   "positive-200": "#6ae66e",
   "positive-300": "#5ecc62",
   "positive-400": "#53b355",
   "positive-500": "#479949",
   "positive-600": "#3b803d",
   "positive-700": "#2f6631",
   "positive-800": "#234c25",
   "positive-900": "#183318",
   "negative-100": "#fa8072",
   "negative-200": "#e17367",
   "negative-300": "#c8665b",
   "negative-400": "#af5a50",
   "negative-500": "#964d44",
   "negative-600": "#7d4039",
   "negative-700": "#64332e",
   "negative-800": "#4b2622",
   "negative-900": "#321a17",
   "caution-100": "#ed9121",
   "caution-200": "#d5831e",
   "caution-300": "#be741a",
   "caution-400": "#a66617",
   "caution-500": "#8e5714",
   "caution-600": "#774911",
   "caution-700": "#5f3a0d",
   "caution-800": "#472b0a",
   "caution-900": "#2f1d07",
   text: "#EBEBD3",
};

export const charcoalTheme: ColorTheme = {
   surface: "#303030",
   "surface-alt": "#262626",
   "surface-deep": "#1f1f1f",
   "primary-300": "#9cb9c4",
   "primary-400": "#6c93a4",
   "primary-500": "#517889",
   "primary-600": "#456375",
   "primary-700": "#3d5361",
   "primary-800": "#384752",
   "primary-900": "#323e47",
   "positive-100": "#76ff7a",
   "positive-200": "#6ae66e",
   "positive-300": "#5ecc62",
   "positive-400": "#53b355",
   "positive-500": "#479949",
   "positive-600": "#3b803d",
   "positive-700": "#2f6631",
   "positive-800": "#234c25",
   "positive-900": "#183318",
   "negative-100": "#fa8072",
   "negative-200": "#e17367",
   "negative-300": "#c8665b",
   "negative-400": "#af5a50",
   "negative-500": "#964d44",
   "negative-600": "#7d4039",
   "negative-700": "#64332e",
   "negative-800": "#4b2622",
   "negative-900": "#321a17",
   "caution-100": "#ed9121",
   "caution-200": "#d5831e",
   "caution-300": "#be741a",
   "caution-400": "#a66617",
   "caution-500": "#8e5714",
   "caution-600": "#774911",
   "caution-700": "#5f3a0d",
   "caution-800": "#472b0a",
   "caution-900": "#2f1d07",
   text: "#EBEBD3",
};

export const scarletTheme: ColorTheme = {
   surface: "#303030",
   "surface-alt": "#262626",
   "surface-deep": "#1f1f1f",
   "primary-300": "#ff9f70",
   "primary-400": "#ff6b37",
   "primary-500": "#ff400a",
   "primary-600": "#f02a06",
   "primary-700": "#c71b07",
   "primary-800": "#9e170e",
   "primary-900": "#7f170f",
   "positive-100": "#76ff7a",
   "positive-200": "#6ae66e",
   "positive-300": "#5ecc62",
   "positive-400": "#53b355",
   "positive-500": "#479949",
   "positive-600": "#3b803d",
   "positive-700": "#2f6631",
   "positive-800": "#234c25",
   "positive-900": "#183318",
   "negative-100": "#fa8072",
   "negative-200": "#e17367",
   "negative-300": "#c8665b",
   "negative-400": "#af5a50",
   "negative-500": "#964d44",
   "negative-600": "#7d4039",
   "negative-700": "#64332e",
   "negative-800": "#4b2622",
   "negative-900": "#321a17",
   "caution-100": "#ed9121",
   "caution-200": "#d5831e",
   "caution-300": "#be741a",
   "caution-400": "#a66617",
   "caution-500": "#8e5714",
   "caution-600": "#774911",
   "caution-700": "#5f3a0d",
   "caution-800": "#472b0a",
   "caution-900": "#2f1d07",
   text: "#EBEBD3",
};

const store = createStore(
   combine(
      {
         themeType: "pine green" as ThemeType,
         theme: pineGreenTheme as ColorTheme,
      },
      (set) => ({
         setTheme: (type: ThemeType) =>
            set(() => {
               let theme: ColorTheme;
               switch (type) {
                  case "cerulean":
                     theme = ceruleanTheme;
                     break;
                  case "pine green":
                     theme = pineGreenTheme;
                     break;
                  case "eggplant":
                     theme = eggplantTheme;
                     break;
                  case "coffee":
                     theme = coffeeTheme;
                     break;
                  case "charcoal":
                     theme = charcoalTheme;
                     break;
                  case "scarlet":
                     theme = scarletTheme;
                     break;
                  default:
                     theme = ceruleanTheme;
               }
               setColorProperty(theme);
               return { themeType: type, theme };
            }),
      }),
   ),
);

const ThemeContext = createContext<typeof store>({} as typeof store);

export function ThemeProvider(props: { children?: ReactNode }) {
   const files = useFilesStore();

   useLayoutEffect(() => {
      store.getState().setTheme(files.settings.theme);
   }, [files.settings.theme]);

   return <ThemeContext.Provider value={store}>{props.children}</ThemeContext.Provider>;
}

function setColorProperty(theme: ColorTheme) {
   const style = document.documentElement.style;
   style.setProperty("--tcolor-surface", hexToRgb(theme["surface"]));
   style.setProperty("--tcolor-surface-alt", hexToRgb(theme["surface-alt"]));
   style.setProperty("--tcolor-surface-deep", hexToRgb(theme["surface-deep"]));

   style.setProperty("--tcolor-primary-300", hexToRgb(theme["primary-300"]));
   style.setProperty("--tcolor-primary-400", hexToRgb(theme["primary-400"]));
   style.setProperty("--tcolor-primary-500", hexToRgb(theme["primary-500"]));
   style.setProperty("--tcolor-primary-600", hexToRgb(theme["primary-600"]));
   style.setProperty("--tcolor-primary-700", hexToRgb(theme["primary-700"]));
   style.setProperty("--tcolor-primary-800", hexToRgb(theme["primary-800"]));
   style.setProperty("--tcolor-primary-900", hexToRgb(theme["primary-900"]));

   style.setProperty("--tcolor-positive-100", hexToRgb(theme["positive-100"]));
   style.setProperty("--tcolor-positive-200", hexToRgb(theme["positive-200"]));
   style.setProperty("--tcolor-positive-300", hexToRgb(theme["positive-300"]));
   style.setProperty("--tcolor-positive-400", hexToRgb(theme["positive-400"]));
   style.setProperty("--tcolor-positive-500", hexToRgb(theme["positive-500"]));
   style.setProperty("--tcolor-positive-600", hexToRgb(theme["positive-600"]));
   style.setProperty("--tcolor-positive-700", hexToRgb(theme["positive-700"]));
   style.setProperty("--tcolor-positive-800", hexToRgb(theme["positive-800"]));
   style.setProperty("--tcolor-positive-900", hexToRgb(theme["positive-900"]));

   style.setProperty("--tcolor-negative-100", hexToRgb(theme["negative-100"]));
   style.setProperty("--tcolor-negative-200", hexToRgb(theme["negative-200"]));
   style.setProperty("--tcolor-negative-300", hexToRgb(theme["negative-300"]));
   style.setProperty("--tcolor-negative-400", hexToRgb(theme["negative-400"]));
   style.setProperty("--tcolor-negative-500", hexToRgb(theme["negative-500"]));
   style.setProperty("--tcolor-negative-600", hexToRgb(theme["negative-600"]));
   style.setProperty("--tcolor-negative-700", hexToRgb(theme["negative-700"]));
   style.setProperty("--tcolor-negative-800", hexToRgb(theme["negative-800"]));
   style.setProperty("--tcolor-negative-900", hexToRgb(theme["negative-900"]));

   style.setProperty("--tcolor-caution-100", hexToRgb(theme["caution-100"]));
   style.setProperty("--tcolor-caution-200", hexToRgb(theme["caution-200"]));
   style.setProperty("--tcolor-caution-300", hexToRgb(theme["caution-300"]));
   style.setProperty("--tcolor-caution-400", hexToRgb(theme["caution-400"]));
   style.setProperty("--tcolor-caution-500", hexToRgb(theme["caution-500"]));
   style.setProperty("--tcolor-caution-600", hexToRgb(theme["caution-600"]));
   style.setProperty("--tcolor-caution-700", hexToRgb(theme["caution-700"]));
   style.setProperty("--tcolor-caution-800", hexToRgb(theme["caution-800"]));
   style.setProperty("--tcolor-caution-900", hexToRgb(theme["caution-900"]));

   style.setProperty("--tcolor-text", hexToRgb(theme.text));
}

function hexToRgb(hex: string) {
   const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
   return result ? `${Number.parseInt(result[1], 16)} ${Number.parseInt(result[2], 16)} ${Number.parseInt(result[3], 16)}` : null;
}

export function hexToRgbObject(hex: string) {
   const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
   return result ? { r: Number.parseInt(result[1], 16), g: Number.parseInt(result[2], 16), b: Number.parseInt(result[3], 16) } : null;
}

export function useTheme() {
   return useStore(store);
}

// export function useThemeStore() {
// 	console.log(ThemeContext);
// 	return useStore(ThemeContext);
// }
