import type { VersionFlavour } from "@/types";
import type { ReactNode } from "@tanstack/react-router";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import { type Dispatch, createContext } from "react";

type WindowContextType = {
	maximized: boolean;
	environment: "browser" | "desktop";
	versionFlavour?: VersionFlavour;
};

const defaultValue: WindowContextType = {
	maximized: false,
	environment: window.__TAURI_INTERNALS__ ? "desktop" : "browser",
};

const WindowContext = createContext<WindowContextType>(defaultValue);
const WindowDispatchContext = createContext<Dispatch<Partial<WindowContextType>>>(() => {});

export function WindowProvider(props: { children?: ReactNode }) {
	const [appWindow, dispatch] = useReducer(windowReducer, defaultValue);

	useEffect(() => {
		async function initialize() {
			dispatch({
				maximized: window.__TAURI_INTERNALS__ ? await getCurrentWebviewWindow().isMaximized() : true,
				versionFlavour: await getVersionFlavour(),
			});
		}

		initialize();
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
