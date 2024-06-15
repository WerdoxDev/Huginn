// import { createContext } from "react";

type HistoryContextType = {
   lastPathname?: string | null;
};

export const routeHistory: HistoryContextType = { lastPathname: null };

// const HistoryContext = createContext<HistoryContextType>({ lastPathname: null });
