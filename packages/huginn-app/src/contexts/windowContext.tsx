import type { VersionFlavour } from "@/types";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import { type Dispatch, type ReactNode, createContext } from "react";

type WindowContextType = {
	maximized: boolean;
	environment: "browser" | "desktop";
	versionFlavour?: VersionFlavour;
	focused: boolean;
};

const defaultValue: WindowContextType = {
	maximized: false,
	focused: false,
	environment: globalThis.__TAURI_INTERNALS__ ? "desktop" : "browser",
	versionFlavour: await getVersionFlavour(),
};

const WindowContext = createContext<WindowContextType>(defaultValue);
const WindowDispatchContext = createContext<Dispatch<Partial<WindowContextType>>>(() => {});

export function WindowProvider(props: { children?: ReactNode }) {
	const [appWindow, dispatch] = useReducer(windowReducer, defaultValue);

	useEffect(() => {
		async function initialize() {
			dispatch({
				maximized: globalThis.__TAURI_INTERNALS__ ? await getCurrentWebviewWindow().isMaximized() : true,
			});
		}

		function onFocusChange(event: FocusEvent) {
			dispatch({ focused: event.type === "focus" });
		}

		initialize();
		window.addEventListener("focus", onFocusChange);
		window.addEventListener("blur", onFocusChange);

		return () => {
			window.removeEventListener("focus", onFocusChange);
			window.removeEventListener("blur", onFocusChange);
		};
	}, []);

	return (
		<WindowContext.Provider value={appWindow}>
			<WindowDispatchContext.Provider value={dispatch}>{props.children}</WindowDispatchContext.Provider>
		</WindowContext.Provider>
	);
}

function windowReducer(window: WindowContextType, action: Partial<WindowContextType>): WindowContextType {
	const newWindow = Object.assign({}, window, action);
	return newWindow;
}

export function useWindow() {
	return useContext(WindowContext);
}

export function useWindowDispatch() {
	return useContext(WindowDispatchContext);
}
