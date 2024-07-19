import { ReactNode } from "@tanstack/react-router";
import { appWindow } from "@tauri-apps/api/window";
import { Dispatch, createContext, useContext, useReducer } from "react";

type WindowContextType = {
   maximized: boolean;
};
const defaultValue: WindowContextType = { maximized: window.__TAURI__ ? await appWindow.isMaximized() : true };

const WindowContext = createContext<WindowContextType>(defaultValue);
const WindowDispatchContext = createContext<Dispatch<Partial<WindowContextType>>>(() => {});

export function WindowProvider(props: { children?: ReactNode }) {
   const [window, dispatch] = useReducer(windowReducer, defaultValue);

   return (
      <WindowContext.Provider value={window}>
         <WindowDispatchContext.Provider value={dispatch}>{props.children}</WindowDispatchContext.Provider>
      </WindowContext.Provider>
   );
}

function windowReducer(window: WindowContextType, action: Partial<WindowContextType>): WindowContextType {
   const maximized = action.maximized ?? window.maximized;
   return { maximized };
}

export function useWindow() {
   return useContext(WindowContext);
}

export function useWindowDispatch() {
   return useContext(WindowDispatchContext);
}
