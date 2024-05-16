import { createContext } from "react";

export const WindowContext = createContext({ maximized: { isMaximized: false, setMaximized: (_maximized: boolean) => {} } });
