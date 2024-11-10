import type { DeepPartial, ThemeType, VersionFlavour } from "@/types";
import { appConfigDir } from "@tauri-apps/api/path";
import { BaseDirectory, exists, mkdir, readTextFile, writeTextFile } from "@tauri-apps/plugin-fs";
import { type ReactNode, createContext } from "react";

const RELEASE_SETTINGS = "settings.json";
const NIGHTLY_SETTINGS = "settings-nightly.json";

export type SettingsContextType = {
	serverAddress: string;
	cdnAddress: string;
	theme: ThemeType;
};

const defaultValue: SettingsContextType = {
	serverAddress: "https://asgard.huginn.dev",
	cdnAddress: "https://asgard.huginn.dev",
	theme: "pine green",
};

let value = defaultValue;
let currentFlavour: VersionFlavour;
let filePath: string;
let localStorageItem: string;

export async function initializeSettings() {
	currentFlavour = await getVersionFlavour();
	filePath = currentFlavour === "nightly" ? NIGHTLY_SETTINGS : RELEASE_SETTINGS;
	localStorageItem = currentFlavour === "nightly" ? "settings-nightly" : "settings";
	if (window.__TAURI_INTERNALS__) {
		await tryCreateSettingsFile();
		value = { ...defaultValue, ...JSON.parse(await readTextFile(filePath, { baseDir: BaseDirectory.AppConfig })) };
	} else {
		if (!localStorage.getItem(localStorageItem)) {
			localStorage.setItem(localStorageItem, JSON.stringify(defaultValue));
		}

		// biome-ignore lint/style/noNonNullAssertion: <explanation>
		value = { ...defaultValue, ...JSON.parse(localStorage.getItem(localStorageItem)!) };
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
			localStorage.setItem(localStorageItem, JSON.stringify({ ...settings, ...action }));
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

	return { ...settings, ...action };
}

async function writeSettingsFile(settings: SettingsContextType) {
	try {
		await writeTextFile(filePath, JSON.stringify(settings, null, 2), { baseDir: BaseDirectory.AppConfig });
	} catch (e) {
		console.error(e);
	}
}

async function tryCreateSettingsFile() {
	try {
		const directory = await appConfigDir();

		if (!(await exists(directory))) {
			await mkdir(directory);
		}

		if (!(await exists(filePath, { baseDir: BaseDirectory.AppConfig }))) {
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
