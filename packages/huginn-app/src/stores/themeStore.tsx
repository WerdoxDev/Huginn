import type { ColorTheme, ThemeType } from "@/types";
import { type ReactNode, createContext } from "react";
import { createStore, useStore } from "zustand";
import { combine } from "zustand/middleware";

export const ceruleanTheme: ColorTheme = {
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

export const pineGreenTheme: ColorTheme = {
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

export const eggplantTheme: ColorTheme = {
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

export const coffeeTheme: ColorTheme = {
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

export const charcoalTheme: ColorTheme = {
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
						default:
							theme = charcoalTheme;
					}
					setColorProperty(theme);
					return { themeType: type, theme };
				}),
		}),
	),
);

const ThemeContext = createContext<typeof store>({} as typeof store);

export function ThemeProvier(props: { children?: ReactNode }) {
	const settings = useSettings();

	useLayoutEffect(() => {
		console.log(settings, "FORM THME");
		store.getState().setTheme(settings.theme);
	}, []);

	return <ThemeContext.Provider value={store}>{props.children}</ThemeContext.Provider>;
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
	return result ? `${Number.parseInt(result[1], 16)} ${Number.parseInt(result[2], 16)} ${Number.parseInt(result[3], 16)}` : null;
}

export function useTheme() {
	const store = useContext(ThemeContext);
	return useStore(store);
}

export function useThemeStore() {
	return useContext(ThemeContext);
}
