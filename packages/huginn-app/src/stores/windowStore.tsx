import type { UnlistenFn } from "@tauri-apps/api/event";
import { type WebviewWindow, getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import { type CliMatches, getMatches } from "@tauri-apps/plugin-cli";
import { createStore, useStore } from "zustand";
import { combine } from "zustand/middleware";

const store = createStore(
	combine(
		{
			maximized: false,
			focused: false,
			environment: globalThis.__TAURI_INTERNALS__ ? "desktop" : "browser",
			matches: {} as CliMatches,
			window: {} as WebviewWindow,
		},
		(set) => ({
			setMaximized: (isMaximized: boolean) => set({ maximized: isMaximized }),
			setMatches: (matches: CliMatches) => set({ matches }),
		}),
	),
);

export async function initializeWindow() {
	store.setState({
		maximized: globalThis.__TAURI_INTERNALS__ ? await getCurrentWebviewWindow().isMaximized() : true,
		focused: document.hasFocus(),
		matches: globalThis.__TAURI_INTERNALS__ ? await getMatches() : undefined,
		window: getCurrentWebviewWindow(),
	});

	function onFocusChange(event: FocusEvent) {
		store.setState({ focused: event.type === "focus" });
	}

	window.addEventListener("focus", onFocusChange);
	window.addEventListener("blur", onFocusChange);

	let unlisten: UnlistenFn;
	if (store.getState().environment === "desktop") {
		const appWindow = getCurrentWebviewWindow();
		unlisten = await appWindow.onResized(async () => {
			const appMaximized = await appWindow.isMaximized();
			store.setState({ maximized: appMaximized });
		});
	}

	return () => {
		unlisten();
		window.removeEventListener("focus", onFocusChange);
		window.removeEventListener("blur", onFocusChange);
	};
}

export const windowStore = store;

export function useHuginnWindow() {
	return useStore(store);
}
