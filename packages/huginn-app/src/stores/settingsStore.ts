import type { ThemeType } from "@/types";
import { createStore, useStore } from "zustand";
import { combine } from "zustand/middleware";

export type AppSettings = {
	serverAddress: string;
	cdnAddress: string;
	theme: ThemeType;
	chatMode?: "normal" | "compact";
};

const defaultValue: AppSettings = {
	serverAddress: "https://midgard.huginn.dev",
	cdnAddress: "https://midgard.huginn.dev",
	theme: "pine green",
	chatMode: "normal",
};

let localStorageItem: string;

export async function initializeSettings() {
	localStorageItem = "settings";

	if (window.electronAPI) {
		await window.electronAPI.trySaveDefaultSettings(JSON.stringify(defaultValue));
		const settings = await window.electronAPI.loadSettings();
		store.setState({ ...defaultValue, ...settings });
		return;
	}

	if (!window.localStorage.getItem(localStorageItem)) {
		window.localStorage.setItem(localStorageItem, JSON.stringify(defaultValue));
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

				console.log(newSettings);
				if (window.electronAPI) {
					await window.electronAPI.saveSettings(JSON.stringify(newSettings));
				} else {
					globalThis.localStorage.setItem(localStorageItem, JSON.stringify(newSettings));
				}
			},
		}),
	),
);

export function useSettings() {
	return useStore(store);
}

export const settingsStore = store;
