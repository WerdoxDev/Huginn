import { DeepPartial, StatusCode } from "@/types";
import { ReactNode } from "@tanstack/react-router";
import { Dispatch, createContext, useContext, useReducer } from "react";

type DefaultModal = { isOpen: boolean };
export type ModalContextType = {
   settings: DefaultModal;
   info: DefaultModal & {
      status: StatusCode;
      text: string;
      title: string;
      action?: {
         cancel?: {
            text?: string;
            callback: () => void;
         };
         confirm?: {
            text: string;
            callback: () => void;
         };
      };
      closable: boolean;
   };
};

const defautlValue: ModalContextType = {
   settings: { isOpen: false },
   info: { isOpen: false, status: "none", title: "", text: "", closable: true },
};

const ModalContext = createContext<ModalContextType>(defautlValue);
const ModalDispatchContext = createContext<Dispatch<DeepPartial<ModalContextType>>>(() => {});

export function ModalProvider(props: { children?: ReactNode }) {
   const [modals, dispatch] = useReducer(modalsReducer, defautlValue);

   return (
      <ModalContext.Provider value={modals}>
         <ModalDispatchContext.Provider value={dispatch}>{props.children}</ModalDispatchContext.Provider>
      </ModalContext.Provider>
   );
}

function modalsReducer(modals: ModalContextType, action: DeepPartial<ModalContextType>): ModalContextType {
   const settings = { ...modals.settings, ...action.settings };
   const info = Object.assign({}, modals.info, action.info);

   return { settings, info };
}

export function useModals() {
   return useContext(ModalContext);
}

export function useModalsDispatch() {
   return useContext(ModalDispatchContext);
}
