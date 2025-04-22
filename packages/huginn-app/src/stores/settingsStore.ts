import type { ThemeType } from "@/types";
import { createStore, useStore } from "zustand";
import { combine } from "zustand/middleware";

export type AppSettings = {
	serverAddress: string;
	cdnAddress: string;
	theme: ThemeType;
	chatMode?: "normal" | "compact";
	inputDeviceId: string;
	outputDeviceId: string;
	inputVolume: number;
	outputVolume: number;
	inputThreshold: number;
};

const initialStore = () =>
	({
		serverAddress: "https://midgard.huginn.dev",
		cdnAddress: "https://midgard.huginn.dev",
		theme: "pine green",
		chatMode: "normal",
		inputDeviceId: "",
		outputDeviceId: "",
		inputThreshold: -50,
		inputVolume: 100,
		outputVolume: 100,
	}) as AppSettings;

let localStorageItem: string;

export async function initializeSettings() {
	localStorageItem = "settings";
	const initialValue = initialStore();

	if (window.electronAPI) {
		await window.electronAPI.trySaveDefaultSettings(JSON.stringify(initialValue));
		const settings = await window.electronAPI.loadSettings();
		store.setState({ ...initialValue, ...settings });
		return;
	}

	if (!window.localStorage.getItem(localStorageItem)) {
		window.localStorage.setItem(localStorageItem, JSON.stringify(initialValue));
	}
	// biome-ignore lint/style/noNonNullAssertion: <explanation>
	store.setState({ ...initialValue, ...JSON.parse(globalThis.localStorage.getItem(localStorageItem)!) });
}

const store = createStore(
	combine(initialStore(), (set, get) => ({
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
	})),
);

export function useSettings() {
	return useStore(store);
}

export const settingsStore = store;
