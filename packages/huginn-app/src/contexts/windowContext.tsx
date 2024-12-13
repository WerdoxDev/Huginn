import type { VersionFlavour } from "@/types";
import { type Dispatch, type ReactNode, createContext } from "react";

type WindowContextType = {
  maximized: boolean;
  environment: "browser" | "desktop";
  versionFlavour?: VersionFlavour;
};

const defaultValue: WindowContextType = {
  maximized: false,
  environment: globalThis.__TAURI_INTERNALS__ ? "desktop" : "browser",
  versionFlavour: "nightly",
};

const WindowContext = createContext<WindowContextType>(defaultValue);
const WindowDispatchContext = createContext<
  Dispatch<Partial<WindowContextType>>
>(() => {});

export function WindowProvider(props: { children?: ReactNode }) {
  const [appWindow, dispatch] = useReducer(windowReducer, defaultValue);

  useEffect(() => {
    async function initialize() {}

    initialize();
  }, []);

  return (
    <WindowContext.Provider value={appWindow}>
      <WindowDispatchContext.Provider value={dispatch}>
        {props.children}
      </WindowDispatchContext.Provider>
    </WindowContext.Provider>
  );
}

function windowReducer(
  window: WindowContextType,
  action: Partial<WindowContextType>
): WindowContextType {
  const newWindow = Object.assign({}, window, action);
  return newWindow;
}

export function useWindow() {
  return useContext(WindowContext);
}

export function useWindowDispatch() {
  return useContext(WindowDispatchContext);
}
