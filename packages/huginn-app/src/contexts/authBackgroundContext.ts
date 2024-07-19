import { createContext } from "react";

export const AuthBackgroundContext = createContext({ state: 2, setState: (_state: number) => {} });
