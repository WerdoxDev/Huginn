import type { UnlistenFn } from "@tauri-apps/api/event";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import { type CliMatches, getMatches } from "@tauri-apps/plugin-cli";
import { type ReactNode, createContext } from "react";
import { createStore, useStore } from "zustand";
import { combine } from "zustand/middleware";

const store = createStore(
	combine(
		{
			maximized: false,
			focused: false,
			environment: globalThis.__TAURI_INTERNALS__ ? "desktop" : "browser",
			matches: {} as CliMatches,
		},
		(set) => ({
			setMaximized: (isMaximized: boolean) => set({ maximized: isMaximized }),
			setMatches: (matches: CliMatches) => set({ matches }),
		}),
	),
);

const HuginnWindowContext = createContext<typeof store>({} as typeof store);

export function HuginnWindowProvider(props: { children?: ReactNode }) {
	const [windowLoaded, setWindowLoaded] = useState(false);

	function onFocusChange(event: FocusEvent) {
		store.setState({ focused: event.type === "focus" });
	}

	useEffect(() => {
		async function initialize() {
			store.setState({
				maximized: globalThis.__TAURI_INTERNALS__ ? await getCurrentWebviewWindow().isMaximized() : true,
				focused: document.hasFocus(),
				matches: await getMatches(),
			});
		}

		initialize().then(() => setWindowLoaded(true));

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

	return <HuginnWindowContext.Provider value={store}>{windowLoaded && props.children}</HuginnWindowContext.Provider>;
}

export function useHuginnWindow() {
	return useStore(store);
}
