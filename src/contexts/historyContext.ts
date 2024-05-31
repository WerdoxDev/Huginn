import { createContext } from "react";

type HistoryContextType = {
   lastPathname?: string | null;
};

export const HistoryContext = createContext<HistoryContextType>({ lastPathname: null });
