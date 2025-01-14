import type { DeepPartial, ThemeType } from "@/types";
import { appConfigDir } from "@tauri-apps/api/path";
import { BaseDirectory, exists, mkdir, readFile, writeTextFile } from "@tauri-apps/plugin-fs";
import { type ReactNode, createContext } from "react";

export type SettingsContextType = {
	serverAddress: string;
	cdnAddress: string;
	theme: ThemeType;
	chatMode?: "normal" | "compact";
};

const defaultValue: SettingsContextType = {
	serverAddress: "https://midgard.huginn.dev",
	cdnAddress: "https://midgard.huginn.dev",
	theme: "pine green",
	chatMode: "normal",
};

let value = defaultValue;
let filePath: string;
let localStorageItem: string;

export async function initializeSettings() {
	filePath = "settings.json";
	localStorageItem = "settings";

	if (globalThis.__TAURI_INTERNALS__) {
		await tryCreateSettingsFile();
		const fileContent = new TextDecoder().decode(await readFile(filePath, { baseDir: BaseDirectory.AppConfig }));
		value = { ...defaultValue, ...JSON.parse(fileContent) };
	} else {
		if (!globalThis.localStorage.getItem(localStorageItem)) {
			globalThis.localStorage.setItem(localStorageItem, JSON.stringify(defaultValue));
		}
		// biome-ignore lint/style/noNonNullAssertion: <explanation>
		value = { ...defaultValue, ...JSON.parse(globalThis.localStorage.getItem(localStorageItem)!) };
	}
}

const SettingsContext = createContext<SettingsContextType>(value);
const SettingsDispatchContext = createContext<(action: DeepPartial<SettingsContextType>) => Promise<void>>(() => new Promise(() => {}));

export function SettingsProvider(props: { children?: ReactNode }) {
	const [settings, dispatch] = useReducer(settingsReducer, value);

	async function dispatchSaveSettings(action: DeepPartial<SettingsContextType>) {
		if (globalThis.__TAURI_INTERNALS__) {
			await writeSettingsFile({ ...settings, ...action });
		} else {
			globalThis.localStorage.setItem(localStorageItem, JSON.stringify({ ...settings, ...action }));
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
