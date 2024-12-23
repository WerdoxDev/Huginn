import { ref } from "vue";

const themeStorageKey = "theme-type"

export type ThemeType = "cerulean" | "pine green" | "eggplant" | "coffee" | "charcoal";

export type ColorTheme = {
    type: ThemeType,

    background: string,
    secondary: string,
    tertiary: string,
    primary: string,
    accent: string,
    accent2: string,
    success: string,
    text: string,
    error: string,
    warning: string,

    logo: string,
    logoOutline: string,
}

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

    logo: "huginn-cerulean.png",
    logoOutline: "huginn-cerulean-outlined.png"
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

    logo: "huginn-pinegreen.png",
    logoOutline: "huginn-pinegreen-outlined.png"
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

    logo: "huginn-eggplant.png",
    logoOutline: "huginn-eggplant-outlined.png"
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

    logo: "huginn-coffee.png",
    logoOutline: "huginn-coffee-outlined.png"
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

    logo: "huginn-charcoal.png",
    logoOutline: "huginn-charcoal-outlined.png"
};

export let currentTheme = ref(coffeeTheme);

export function loadTheme() {
    let loadedTheme: ThemeType = localStorage.getItem(themeStorageKey) as ThemeType

    if (loadedTheme === null) {
        loadedTheme = "coffee"
    }

    useChangeTheme(loadedTheme)
}

export function useChangeTheme(theme: ThemeType) {
    currentTheme.value = getColorTheme(theme)
    setColorProperty(currentTheme.value)

    localStorage.setItem(themeStorageKey, theme)
}

function getColorTheme(type: ThemeType): ColorTheme {
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
        default:
            theme = coffeeTheme;
    }

    return theme;
}

function setColorProperty(theme: ColorTheme) {
    const style = document.documentElement.style;
    style.setProperty("--background", hexToRgb(theme.background));
    style.setProperty("--secondary", hexToRgb(theme.secondary));
    style.setProperty("--tertiary", hexToRgb(theme.tertiary));
    style.setProperty("--primary", hexToRgb(theme.primary));
    style.setProperty("--accent", hexToRgb(theme.accent));
    style.setProperty("--accent2", hexToRgb(theme.accent2));
    style.setProperty("--success", hexToRgb(theme.success));
    style.setProperty("--text", hexToRgb(theme.text));
    style.setProperty("--error", hexToRgb(theme.error));
    style.setProperty("--warning", hexToRgb(theme.warning));
}

function hexToRgb(hex: string) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? `${Number.parseInt(result[1], 16)} ${Number.parseInt(result[2], 16)} ${Number.parseInt(result[3], 16)}` : null;
}