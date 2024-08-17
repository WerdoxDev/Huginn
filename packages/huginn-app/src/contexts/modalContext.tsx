import { ReactNode } from "@tanstack/react-router";
import { Dispatch, createContext, useContext, useReducer } from "react";
import { StatusCode, DeepPartial } from "@/types";

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
   console.log(action.info);
   const settings = { ...modals.settings, ...action.settings };
   const info = Object.assign({}, modals.info, action.info);
   // const info = {
   //    isOpen: action.info?.isOpen ?? modals.info.isOpen,
   //    status: action.info?.status ?? modals.info.status,
   //    text: action.info?.text ?? modals.info.text,
   //    action: action.info?.action ?? modals.info.action,
   // };
   return { settings, info };
}

export function useModals() {
   return useContext(ModalContext);
}

export function useModalsDispatch() {
   return useContext(ModalDispatchContext);
}
