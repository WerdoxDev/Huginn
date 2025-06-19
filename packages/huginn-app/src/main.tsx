import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import ReactDOM from "react-dom/client";
import { RouterProvider } from "react-router";
import "./index.css";
import { enableLogs } from "@huginn/shared";
import router from "./routes";

const root = document.getElementById("root");
// enableLogs(["api:gateway", "api:voice"], ["voice:default", "gateway:default"]);
// enableLogs(
// 	["app:audio-level-checker", "app:audio-source-player", "app:voice-client", "app:voice-input-device", "app:voice-store", "api:voice"],
// 	[
// 		"voice:local-voice-state",
// 		"audio-level-checker:default",
// 		"audio-source-player:default",
// 		"voice-client:default",
// 		"voice-client:emitter-recv",
// 		"voice-store:voice-state",
// 		"voice-store:voice-recv",
// 		"voice-store:voice-preferences",
// 		"voice-store:speaking-state",
// 		"voice-store:remote-sources",
// 		"voice-store:gateway-recv",
// 		"voice-store:default",
// 		"voice-store:call-state",
// 		"voice-input-device:default",
// 		"voice-client:settings-sub",
// 		"voice-client:voice-recv",
// 	],
// );
enableLogs(["api:gateway"], ["gateway:send-detail", "gateway:recv-detail"]);
// enableLogs(["api:gateway", "api:voice"], ["api:voice-default", "api:gateway-send"]);

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
