import { useContext } from "react";
import { WindowContext, WindowDispatchContext } from "../contexts/windowContext";

export function useWindow() {
   return useContext(WindowContext);
}

export function useWindowDispatch() {
   return useContext(WindowDispatchContext);
}
