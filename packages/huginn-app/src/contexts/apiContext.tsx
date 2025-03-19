import { HuginnClient } from "@huginn/api";
import { type ReactNode, createContext, useContext, useMemo } from "react";
import { useSettings } from "./settingsContext";

type APIContextType = HuginnClient;

// biome-ignore lint/style/noNonNullAssertion: <explanation>
const APIContext = createContext<APIContextType>(undefined!);
// biome-ignore lint/style/noNonNullAssertion: <explanation>
export let client: HuginnClient = undefined!;

export function APIProvider(props: { children?: ReactNode }) {
	const settings = useSettings();

	const _client = useMemo(() => {
		if (!window.location.pathname.includes("splashscreen") && client === undefined) {
			client = new HuginnClient({
				rest: { api: `${settings.serverAddress}/api` },
				cdn: { url: `${settings.cdnAddress}/cdn` },
				gateway: {
					url: `${settings.serverAddress}/gateway`,
					intents: 0,
					log: true,
					createSocket(url) {
						return new WebSocket(url);
					},
				},
				voice: {
					url: `http://localhost:3003/voice`,
					createSocket(url) {
						return new WebSocket(url);
					},
				},
			});

			client.gateway.connect();
		}
	}, []);

	return <APIContext.Provider value={client}>{props.children}</APIContext.Provider>;
}

export function useClient() {
	return useContext(APIContext);
}
