import { createContext } from "react";

type ModalContextType = Record<string, { isOpen: boolean; setIsOpen: (isOpen: boolean) => void }>;

export const ModalContext = createContext<ModalContextType>({});
