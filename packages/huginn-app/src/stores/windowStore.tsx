import { createStore, useStore } from "zustand";
import { combine } from "zustand/middleware";

const store = createStore(
	combine(
		{
			maximized: false,
			focused: false,
			environment: window.electronAPI ? "desktop" : "browser",
			args: [] as string[],
			version: "",
		},
		(set) => ({
			setMaximized: (isMaximized: boolean) => set({ maximized: isMaximized }),
		}),
	),
);

export async function initializeWindow() {
	store.setState({
		maximized: true,
		focused: document.hasFocus(),
		args: window.electronAPI ? await window.electronAPI.getArgs() : undefined,
		version: window.electronAPI ? await window.electronAPI.getVersion() : __APP_VERSION__,
	});

	function onFocusChange(event: FocusEvent) {
		store.setState({ focused: event.type === "focus" });
	}

	window.addEventListener("focus", onFocusChange);
	window.addEventListener("blur", onFocusChange);

	//TODO: MIGRATION
	// let unlisten: UnlistenFn;
	// let unlisten2: UnlistenFn;
	// if (store.getState().environment === "desktop") {
	// 	const appWindow = getCurrentWebviewWindow();
	// 	unlisten = await appWindow.onResized(async () => {
	// 		const appMaximized = await appWindow.isMaximized();
	// 		store.setState({ maximized: appMaximized });
	// 	});

	// 	unlisten2 = await listen("tray-clicked", () => {
	// 		invoke("open_and_focus_main");
	// 	});
	// }

	return () => {
		// unlisten();
		// unlisten2();
		window.removeEventListener("focus", onFocusChange);
		window.removeEventListener("blur", onFocusChange);
	};
}

export const windowStore = store;

export function useHuginnWindow() {
	return useStore(store);
}
