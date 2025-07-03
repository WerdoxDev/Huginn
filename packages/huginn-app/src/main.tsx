import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import ReactDOM from "react-dom/client";
import { RouterProvider } from "react-router";
import "./index.css";
import { enableLogs } from "@huginn/shared";
import router from "./routes";

const root = document.getElementById("root");
// enableLogs(["api:gateway", "api:voice"], ["default", "default"]);
// enableLogs(
// 	["app:audio-level-checker", "app:audio-source-player", "app:voice-client", "app:voice-input-device", "app:voice-store", "api:voice"],
// 	[
// 		"local-voice-state",
// 		"default",
// 		"default",
// 		"default",
// 		"emitter-recv",
// 		"voice-state",
// 		"voice-recv",
// 		"voice-preferences",
// 		"speaking-state",
// 		"remote-sources",
// 		"gateway-recv",
// 		"default",
// 		"call-state",
// 		"default",
// 		"settings-sub",
// 		"voice-recv",
// 	],
// );
enableLogs({
	"api:voice": ["default", "send", "recv", "heartbeat", "local-voice-state"],
	"api:gateway": ["default", "send", "recv"],
	"api:client": ["ready-state"],
	"app:api-client": ["default"],
});

export const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			refetchOnReconnect: false,
			refetchOnWindowFocus: false,
			refetchOnMount: false,
			staleTime: 60000,
		},
	},
});

// biome-ignore lint/style/noNonNullAssertion: react needs a non nullable root
ReactDOM.createRoot(root!).render(
	<QueryClientProvider client={queryClient}>
		<RouterProvider router={router} />
	</QueryClientProvider>,
);
