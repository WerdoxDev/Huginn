import { useContext } from "react";
import { ModalContext, ModalDispatchContext } from "../contexts/modalContext";

export function useModals() {
   return useContext(ModalContext);
}

export function useModalsDispatch() {
   return useContext(ModalDispatchContext);
}
