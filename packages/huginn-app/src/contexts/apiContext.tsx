import { useSettings } from "@contexts/settingsContext.tsx";
import { HuginnClient } from "@huginn/api";
import { type ReactNode, createContext, useContext, useState } from "react";

type APIContextType = HuginnClient;

// biome-ignore lint/style/noNonNullAssertion: <explanation>
const APIContext = createContext<APIContextType>(undefined!);

export function APIProvider(props: { children?: ReactNode }) {
	const settings = useSettings();

	const [client] = useState<APIContextType>(
		() =>
			new HuginnClient({
				rest: { api: `${settings.serverAddress}/api`, cdn: settings.cdnAddress },
				gateway: {
					url: `${settings.serverAddress}/gateway`,
					createSocket(url) {
						return new WebSocket(url);
					},
				},
			}),
	);

	return <APIContext.Provider value={client}>{props.children}</APIContext.Provider>;
}

export function useClient() {
	return useContext(APIContext);
}
