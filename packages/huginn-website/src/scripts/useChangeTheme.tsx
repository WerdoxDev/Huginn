import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

const themeStorageKey = "theme-type";

export type ThemeType = "cerulean" | "pine green" | "eggplant" | "coffee" | "charcoal";

export type ColorTheme = {
  type: ThemeType;

  background: string;
  secondary: string;
  tertiary: string;
  primary: string;
  accent: string;
  accent2: string;
  success: string;
  text: string;
  error: string;
  warning: string;

  logo: string;
  logoOutline: string;
};

export const ceruleanTheme: ColorTheme = {
  type: "cerulean",

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

  logo: "cerulean.png",
  logoOutline: "cerulean_outline_thick.png",
};

export const pineGreenTheme: ColorTheme = {
  type: "pine green",

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

  logo: "pinegreen.png",
  logoOutline: "pinegreen_outline_thick.png",
};

export const eggplantTheme: ColorTheme = {
  type: "eggplant",

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

  logo: "eggplant.png",
  logoOutline: "eggplant_outline_thick.png",
};

export const coffeeTheme: ColorTheme = {
  type: "coffee",

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

  logo: "coffee.png",
  logoOutline: "coffee_outline_thick.png",
};

export const charcoalTheme: ColorTheme = {
  type: "charcoal",

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

  logo: "charcoal.png",
  logoOutline: "charcoal_outline_thick.png",
};

type ThemeContextValue = {
  currentTheme: ColorTheme;
  setThemeType: (type: ThemeType) => void;
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [currentTheme, setCurrentTheme] = useState<ColorTheme>(coffeeTheme);

  const setThemeType = useCallback((type: ThemeType) => {
    const theme = getColorTheme(type);
    setCurrentTheme(theme);
    setColorProperty(theme);
    localStorage.setItem(themeStorageKey, type);
  }, []);

  useEffect(() => {
    const storedTheme = localStorage.getItem(themeStorageKey) as ThemeType | null;
    setThemeType(storedTheme ?? "coffee");
  }, [setThemeType]);

  const value = useMemo(() => ({ currentTheme, setThemeType }), [currentTheme, setThemeType]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }

  return context;
}

function getColorTheme(type: ThemeType): ColorTheme {
  switch (type) {
    case "cerulean":
      return ceruleanTheme;
    case "pine green":
      return pineGreenTheme;
    case "eggplant":
      return eggplantTheme;
    case "coffee":
      return coffeeTheme;
    case "charcoal":
      return charcoalTheme;
    default:
      return coffeeTheme;
  }
}

function setColorProperty(theme: ColorTheme) {
  const style = document.documentElement.style;
  setColorVar(style, "--background", theme.background);
  setColorVar(style, "--secondary", theme.secondary);
  setColorVar(style, "--tertiary", theme.tertiary);
  setColorVar(style, "--primary", theme.primary);
  setColorVar(style, "--accent", theme.accent);
  setColorVar(style, "--accent2", theme.accent2);
  setColorVar(style, "--success", theme.success);
  setColorVar(style, "--text", theme.text);
  setColorVar(style, "--error", theme.error);
  setColorVar(style, "--warning", theme.warning);
}

function setColorVar(style: CSSStyleDeclaration, name: string, value: string) {
  const rgb = hexToRgb(value);
  if (!rgb) return;
  style.setProperty(name, rgb);
}

function hexToRgb(hex: string) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? `${Number.parseInt(result[1], 16)} ${Number.parseInt(result[2], 16)} ${Number.parseInt(result[3], 16)}`
    : null;
}
