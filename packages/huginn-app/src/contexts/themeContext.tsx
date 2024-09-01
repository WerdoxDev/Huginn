import { Dispatch, ReactNode, createContext, useContext, useEffect, useReducer } from "react";
import { useSettings } from "./settingsContext";
import { ColorTheme, ThemeType } from "@/types";

const ceruleanTheme: ColorTheme = {
   background: "#303030",
   secondary: "#262626",
   tertiary: "#1f1f1f",
   primary: "#007BA7",
   accent: "#00A7E3",
   accent2: "#007BA7",
   success: "#76FF7A",
   text: "#EBEBD3",
   error: "#FA8072",
   warning: "#ED9121",
};

const pineGreenTheme: ColorTheme = {
   background: "#303030",
   secondary: "#262626",
   tertiary: "#1f1f1f",
   primary: "#01796F",
   accent: "#02CAB9",
   accent2: "#01796F",
   success: "#76FF7A",
   text: "#EBEBD3",
   error: "#FA8072",
   warning: "#ED9121",
};

const eggplantTheme: ColorTheme = {
   background: "#303030",
   secondary: "#262626",
   tertiary: "#1f1f1f",
   primary: "#7C515D",
   accent: "#DC8B9A",
   accent2: "#7C515D",
   success: "#76FF7A",
   text: "#EBEBD3",
   error: "#FA8072",
   warning: "#ED9121",
};

const coffeeTheme: ColorTheme = {
   background: "#303030",
   secondary: "#262626",
   tertiary: "#1f1f1f",
   primary: "#7B563C",
   accent: "#D99A6C",
   accent2: "#7B563C",
   success: "#76FF7A",
   text: "#EBEBD3",
   error: "#FA8072",
   warning: "#ED9121",
};

const charcoalTheme: ColorTheme = {
   background: "#303030",
   secondary: "#262626",
   tertiary: "#1f1f1f",
   primary: "#36454F",
   accent: "#9FB1BD",
   accent2: "#36454F",
   success: "#76FF7A",
   text: "#EBEBD3",
   error: "#FA8072",
   warning: "#ED9121",
};

const defaultValue: ColorTheme = pineGreenTheme;

const ThemeContext = createContext<ColorTheme>(defaultValue);
const ThemeContextDispather = createContext<Dispatch<ThemeType>>(() => {});

export function ThemeProvier(props: { children?: ReactNode }) {
   const settings = useSettings();
   const [colorTheme, dispatch] = useReducer(colorThemeReducer, defaultValue);

   useEffect(() => {
      dispatch(settings.theme);
   }, []);
   return (
      <ThemeContext.Provider value={colorTheme}>
         <ThemeContextDispather.Provider value={dispatch}>{props.children}</ThemeContextDispather.Provider>
      </ThemeContext.Provider>
   );
}

function colorThemeReducer(_colorTheme: ColorTheme, action: ThemeType): ColorTheme {
   switch (action) {
      case "cerulean":
         setColorProperty(ceruleanTheme);
         return ceruleanTheme;
      case "pine green":
         setColorProperty(pineGreenTheme);
         return pineGreenTheme;
      case "eggplant":
         setColorProperty(eggplantTheme);
         return eggplantTheme;
      case "coffee":
         setColorProperty(coffeeTheme);
         return coffeeTheme;
      case "charcoal":
         setColorProperty(charcoalTheme);
         return charcoalTheme;
      default:
         return pineGreenTheme;
   }
}

function setColorProperty(theme: ColorTheme) {
   const style = document.documentElement.style;
   style.setProperty("--color-background", hexToRgb(theme.background));
   style.setProperty("--color-secondary", hexToRgb(theme.secondary));
   style.setProperty("--color-tertiary", hexToRgb(theme.tertiary));
   style.setProperty("--color-primary", hexToRgb(theme.primary));
   style.setProperty("--color-accent", hexToRgb(theme.accent));
   style.setProperty("--color-accent2", hexToRgb(theme.accent2));
   style.setProperty("--color-success", hexToRgb(theme.success));
   style.setProperty("--color-text", hexToRgb(theme.text));
   style.setProperty("--color-error", hexToRgb(theme.error));
   style.setProperty("--color-warning", hexToRgb(theme.warning));
}

function hexToRgb(hex: string) {
   const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
   return result ? `${parseInt(result[1], 16)} ${parseInt(result[2], 16)} ${parseInt(result[3], 16)}` : null;
}

export function useTheme() {
   return useContext(ThemeContext);
}

export function useThemeDispather() {
   return useContext(ThemeContextDispather);
}
