import type { DeepPartial, ThemeType } from "@/types";
import { appDataDir } from "@tauri-apps/api/path";
import { BaseDirectory, create, exists, readTextFile, writeTextFile } from "@tauri-apps/plugin-fs";
import { type ReactNode, createContext, useContext, useReducer } from "react";

export type SettingsContextType = {
	serverAddress: string;
	cdnAddress: string;
	theme: ThemeType;
	flavour: "release" | "nightly";
};

const defaultValue: SettingsContextType = {
	serverAddress: "https://asgard.huginn.dev",
	cdnAddress: "https://asgard.huginn.dev",
	theme: "pine green",
	flavour: "release",
};

let value = defaultValue;

export async function initializeSettings() {
	if (window.__TAURI_INTERNALS__) {
		await tryCreateSettingsFile();
		value = { ...defaultValue, ...JSON.parse(await readTextFile("./data/settings.json", { baseDir: BaseDirectory.AppData })) };
	} else {
		if (!localStorage.getItem("settings")) {
			localStorage.setItem("settings", JSON.stringify(defaultValue));
		}

		// biome-ignore lint/style/noNonNullAssertion: <explanation>
		value = { ...defaultValue, ...JSON.parse(localStorage.getItem("settings")!) };
	}
}

const SettingsContext = createContext<SettingsContextType>(value);
const SettingsDispatchContext = createContext<(action: DeepPartial<SettingsContextType>) => Promise<void>>(() => new Promise(() => {}));

export function SettingsProvider(props: { children?: ReactNode }) {
	const [settings, dispatch] = useReducer(settingsReducer, value);

	async function dispatchSaveSettings(action: DeepPartial<SettingsContextType>) {
		if (window.__TAURI_INTERNALS__) {
			await writeSettingsFile({ ...settings, ...action });
		} else {
			localStorage.setItem("settings", JSON.stringify({ ...settings, ...action }));
		}

		dispatch(action);
	}

	return (
		<SettingsContext.Provider value={settings}>
			<SettingsDispatchContext.Provider value={dispatchSaveSettings}>{props.children}</SettingsDispatchContext.Provider>
		</SettingsContext.Provider>
	);
}

function settingsReducer(settings: SettingsContextType, action: DeepPartial<SettingsContextType>) {
	if (!action) return { ...settings };

	if (window.__TAURI_INTERNALS__) {
		writeSettingsFile({ ...settings, ...action });
	} else {
		localStorage.setItem("settings", JSON.stringify({ ...settings, ...action }));
	}

	return { ...settings, ...action };
}

async function writeSettingsFile(settings: SettingsContextType) {
	try {
		await writeTextFile("./data/settings.json", JSON.stringify(settings, null, 2), { baseDir: BaseDirectory.AppData });
	} catch (e) {
		console.error(e);
	}
}

async function tryCreateSettingsFile() {
	try {
		const directory = await appDataDir();
		if (!(await exists(directory))) {
			await create(directory);
		}

		if (!(await exists("data", { baseDir: BaseDirectory.AppData }))) {
			await create("data", { baseDir: BaseDirectory.AppData });
		}

		if (!(await exists("data/settings.json", { baseDir: BaseDirectory.AppData }))) {
			await writeSettingsFile(defaultValue);
		}
	} catch (e) {
		console.error(e);
	}
}

export function useSettings() {
	return useContext(SettingsContext);
}

export function useSettingsDispatcher() {
	return useContext(SettingsDispatchContext);
}
