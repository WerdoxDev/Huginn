// import { createContext } from "react";

type HistoryContextType = {
	lastPathname?: string | null;
	initialPathname?: string | null;
};

export const routeHistory: HistoryContextType = { lastPathname: null, initialPathname: null };

// const HistoryContext = createContext<HistoryContextType>({ lastPathname: null });
