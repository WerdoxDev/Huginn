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
		client = new HuginnClient({
			rest: { api: `${settings.serverAddress}/api`, cdn: settings.cdnAddress },
			gateway: {
				url: `${settings.serverAddress}/gateway`,
				createSocket(url) {
					return new WebSocket(url);
				},
			},
		});

		return client;
	}, []);

	useEffect(() => {
		if (!window.location.pathname.includes("splashscreen") && !_client.gateway.socket) {
			_client.gateway.connect();
		}
	}, []);

	return <APIContext.Provider value={_client}>{props.children}</APIContext.Provider>;
}

export function useClient() {
	return useContext(APIContext);
}
