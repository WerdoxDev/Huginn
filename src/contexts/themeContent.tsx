import { Dispatch, ReactNode, createContext, useContext, useEffect, useReducer } from "react";
import { settingsContent } from "../lib/appData";

const ceruleanTheme: ColorTheme = {
   background: ["48 48 48", "#303030"],
   secondary: ["38 38 38", "#262626"],
   tertiary: ["31 31 31", "#1f1f1f"],
   primary: ["0 123 167", "#007BA7"],
   accent: ["0 180 245", "#00B4F5"],
   accent2: ["", ""],
   text: ["235 235 211", "#EBEBD3"],
   error: ["248 113 113", "#F87171"],
};

const tealTheme: ColorTheme = {
   background: ["48 48 48", "#303030"],
   secondary: ["38 38 38", "#262626"],
   tertiary: ["31 31 31", "#1f1f1f"],
   primary: ["0 128 128", "#008080"],
   accent: ["0 204 204", "#00CCCC"],
   accent2: ["", ""],
   text: ["235 235 211", "#EBEBD3"],
   error: ["248 113 113", "#FE6F5E"],
};

const pineGreenTheme: ColorTheme = {
   background: ["48 48 48", "#303030"],
   secondary: ["38 38 38", "#262626"],
   tertiary: ["31 31 31", "#1f1f1f"],
   primary: ["1 121 111", "#01796F"],
   accent: ["2 202 185", "#02CAB9"],
   accent2: ["", ""],
   text: ["235 235 211", "#EBEBD3"],
   error: ["248 131 121", "#F87171"],
};

const eggplantTheme: ColorTheme = {
   background: ["48 48 48", "#303030"],
   secondary: ["38 38 38", "#262626"],
   tertiary: ["31 31 31", "#1f1f1f"],
   primary: ["97 64 81", "#614051"],
   accent: ["165 120 144", "#A57890"],
   accent2: ["", ""],
   text: ["235 235 211", "#EBEBD3"],
   error: ["248 113 113", "#F87171"],
};

const defaultValue: ColorTheme = tealTheme;
const ThemeContext = createContext<ColorTheme>(defaultValue);
const ThemeContextDispather = createContext<Dispatch<ThemeType>>(() => {});

export function ThemeProvier(props: { children?: ReactNode }) {
   const [colorTheme, dispatch] = useReducer(colorThemeReducer, defaultValue);

   useEffect(() => {
      dispatch(settingsContent?.theme || "teal");
   }, []);
   return (
      <ThemeContext.Provider value={colorTheme}>
         <ThemeContextDispather.Provider value={dispatch}>{props.children}</ThemeContextDispather.Provider>
      </ThemeContext.Provider>
   );
}

function colorThemeReducer(_colorTheme: ColorTheme, action: ThemeType): ColorTheme {
   switch (action) {
      case "teal":
         setColorProperty(tealTheme);
         return tealTheme;
      case "cerulean":
         setColorProperty(ceruleanTheme);
         return ceruleanTheme;
      case "pine green":
         setColorProperty(pineGreenTheme);
         return pineGreenTheme;
      case "eggplant":
         setColorProperty(eggplantTheme);
         return eggplantTheme;
      default:
         return tealTheme;
   }
}

export function useTheme() {
   return useContext(ThemeContext);
}

export function useThemeDispather() {
   return useContext(ThemeContextDispather);
}

function setColorProperty(theme: ColorTheme) {
   const style = document.documentElement.style;
   style.setProperty("--color-background", theme.background[0]);
   style.setProperty("--color-secondary", theme.secondary[0]);
   style.setProperty("--color-tertiary", theme.tertiary[0]);
   style.setProperty("--color-primary", theme.primary[0]);
   style.setProperty("--color-accent", theme.accent[0]);
   style.setProperty("--color-accent2", theme.accent2[0]);
   style.setProperty("--color-text", theme.text[0]);
   style.setProperty("--color-error", theme.error[0]);
}
