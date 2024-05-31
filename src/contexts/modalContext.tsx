import { ReactNode } from "@tanstack/react-router";
import { Dispatch, createContext, useReducer } from "react";

type DefaultModal = { isOpen: boolean };
type ModalContextType = {
   settings: DefaultModal;
   info: DefaultModal & {
      status: StatusCode;
      text: string;
   };
};

const defautlValue: ModalContextType = { settings: { isOpen: false }, info: { isOpen: false, status: "none", text: "" } };

export const ModalContext = createContext<ModalContextType>(defautlValue);
export const ModalDispatchContext = createContext<Dispatch<DeepPartial<ModalContextType>>>(() => {});

export function ModalProvider(props: { children?: ReactNode }) {
   const [modals, dispatch] = useReducer(modalsReducer, defautlValue);

   return (
      <ModalContext.Provider value={modals}>
         <ModalDispatchContext.Provider value={dispatch}>{props.children}</ModalDispatchContext.Provider>
      </ModalContext.Provider>
   );
}

function modalsReducer(modals: ModalContextType, action: DeepPartial<ModalContextType>): ModalContextType {
   const settings = { isOpen: action.settings?.isOpen ?? modals.settings.isOpen };
   const info = {
      isOpen: action.info?.isOpen ?? modals.info.isOpen,
      status: action.info?.status ?? modals.info.status,
      text: action.info?.text ?? modals.info.text,
   };
   return { settings, info };
}
