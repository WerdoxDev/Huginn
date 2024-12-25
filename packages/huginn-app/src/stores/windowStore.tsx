import type { UnlistenFn } from "@tauri-apps/api/event";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import { type ReactNode, createContext } from "react";
import { createStore, useStore } from "zustand";
import { combine } from "zustand/middleware";

const store = createStore(
	combine(
		{
			maximized: false,
			focused: false,
			environment: globalThis.__TAURI_INTERNALS__ ? "desktop" : "browser",
		},
		(set) => ({
			setMaximized: (isMaximized: boolean) => set({ maximized: isMaximized }),
		}),
	),
);

const HuginnWindowContext = createContext<typeof store>({} as typeof store);

export function HuginnWindowProvider(props: { children?: ReactNode }) {
	function onFocusChange(event: FocusEvent) {
		store.setState({ focused: event.type === "focus" });
	}

	useEffect(() => {
		async function initialize() {
			store.setState({
				maximized: globalThis.__TAURI_INTERNALS__ ? await getCurrentWebviewWindow().isMaximized() : true,
				focused: document.hasFocus(),
			});
		}

		initialize();

		window.addEventListener("focus", onFocusChange);
		window.addEventListener("blur", onFocusChange);

		let unlisten: Promise<UnlistenFn>;
		if (store.getState().environment === "desktop") {
			const appWindow = getCurrentWebviewWindow();
			unlisten = appWindow.onResized(async () => {
				const appMaximized = await appWindow.isMaximized();
				store.setState({ maximized: appMaximized });
			});
		}

		return () => {
			unlisten?.then((f) => f());
			window.removeEventListener("focus", onFocusChange);
			window.removeEventListener("blur", onFocusChange);
		};
	}, []);

	return <HuginnWindowContext.Provider value={store}>{props.children}</HuginnWindowContext.Provider>;
}

export function useHuginnWindow() {
	const store = useContext(HuginnWindowContext);
	return useStore(store);
}
