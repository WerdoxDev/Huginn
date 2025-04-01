import type { ThemeType } from "@/types";
import { appConfigDir } from "@tauri-apps/api/path";
import { BaseDirectory, exists, mkdir, readFile, writeTextFile } from "@tauri-apps/plugin-fs";
import { createStore, useStore } from "zustand";
import { combine } from "zustand/middleware";

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

let filePath: string;
let localStorageItem: string;

export async function initializeSettings() {
	filePath = "settings.json";
	localStorageItem = "settings";

	if (globalThis.__TAURI_INTERNALS__) {
		await tryCreateSettingsFile();
		const fileContent = new TextDecoder().decode(await readFile(filePath, { baseDir: BaseDirectory.AppConfig }));
		store.setState({ ...defaultValue, ...JSON.parse(fileContent) });
		return;
	}

	if (!globalThis.localStorage.getItem(localStorageItem)) {
		globalThis.localStorage.setItem(localStorageItem, JSON.stringify(defaultValue));
	}
	// biome-ignore lint/style/noNonNullAssertion: <explanation>
	store.setState({ ...defaultValue, ...JSON.parse(globalThis.localStorage.getItem(localStorageItem)!) });
}

const store = createStore(
	combine(
		{
			serverAddress: "https://midgard.huginn.dev",
			cdnAddress: "https://midgard.huginn.dev",
			theme: "pine green" as ThemeType,
		},
		(set, get) => ({
			setSettings: async (settings: Partial<ReturnType<typeof get>>) => {
				const newSettings = { ...get(), ...settings };
				set(newSettings);

				if (globalThis.__TAURI_INTERNALS__) {
					await writeSettingsFile(newSettings);
				} else {
					globalThis.localStorage.setItem(localStorageItem, JSON.stringify(newSettings));
				}
			},
		}),
	),
);

async function writeSettingsFile(settings: SettingsContextType) {
	try {
		console.log("WRITE", settings);
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
	return useStore(store);
}

export const settingsStore = store;
