import { HuginnClient } from "@huginn/api";
import { type ReactNode, createContext } from "react";

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
				rest: { api: `${settings.serverAddress}/api`, cdn: settings.cdnAddress },
				gateway: {
					url: `${settings.serverAddress}/gateway`,
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
