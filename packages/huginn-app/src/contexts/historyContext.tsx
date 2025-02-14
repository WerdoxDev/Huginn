// import { createContext } from "react";

import { type ReactNode, createContext, useContext, useEffect, useState } from "react";
import { useLocation } from "react-router";

type HistoryContextType = {
	lastPathname?: string;
	initialPathname?: string;
};

const HistoryContext = createContext<HistoryContextType>({});

export function HistoryProvider(props: { children: ReactNode }) {
	const [currentPathname, setCurrentPathname] = useState<string | undefined>();
	const [lastPathname, setLastPathname] = useState<string | undefined>();
	const [initialPathname, setInitialPathname] = useState<string | undefined>(() => window.location.pathname);
	const location = useLocation();

	useEffect(() => {
		if (currentPathname !== window.location.pathname) {
			// Update pathname
			if (currentPathname !== undefined) {
				setLastPathname(currentPathname);
			}
			setCurrentPathname(window.location.pathname);
		}
	}, [location.pathname]);

	return <HistoryContext.Provider value={{ initialPathname, lastPathname }}>{props.children}</HistoryContext.Provider>;
}

export function useHistory() {
	return useContext(HistoryContext);
}
