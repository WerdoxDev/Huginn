import { HuginnClient } from "@huginn/api";
import { type ReactNode, createContext } from "react";

type APIContextType = HuginnClient;

// biome-ignore lint/style/noNonNullAssertion: <explanation>
const APIContext = createContext<APIContextType>(undefined!);

export function APIProvider(props: { children?: ReactNode }) {
	const settings = useSettings();

	const client = useMemo(
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
		[],
	);

	useEffect(() => {
		if (!window.location.pathname.includes("splashscreen")) {
			client.gateway.connect();
		}
	}, []);

	return <APIContext.Provider value={client}>{props.children}</APIContext.Provider>;
}

export function useClient() {
	return useContext(APIContext);
}
