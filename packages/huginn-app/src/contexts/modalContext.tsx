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
   imageCrop: DefaultModal & {
      originalImageData: string;
   };
   createGroup: DefaultModal;
};

const defautlValue: ModalContextType = {
   settings: { isOpen: false },
   info: { isOpen: false, status: "none", title: "", text: "", closable: true },
   imageCrop: { isOpen: false, originalImageData: "" },
   createGroup: { isOpen: false },
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
   const settings = action.settings ? Object.assign({}, modals.settings, action.settings) : modals.settings;
   const info = action.info ? Object.assign({}, modals.info, action.info) : modals.info;
   const imageCrop = action.imageCrop ? Object.assign({}, modals.imageCrop, action.imageCrop) : modals.imageCrop;
   const createGroup = action.createGroup ? Object.assign({}, modals.createGroup, action.createGroup) : modals.createGroup;

   return { settings, info, imageCrop, createGroup };
}

export function useModals() {
   return useContext(ModalContext);
}

export function useModalsDispatch() {
   return useContext(ModalDispatchContext);
}
