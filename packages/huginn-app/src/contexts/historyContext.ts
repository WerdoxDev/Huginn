// import { createContext } from "react";

type HistoryContextType = {
	lastPathname?: string;
	initialPathname?: string;
};

export const routeHistory: HistoryContextType = { lastPathname: undefined, initialPathname: undefined };

// const HistoryContext = createContext<HistoryContextType>({ lastPathname: null });
