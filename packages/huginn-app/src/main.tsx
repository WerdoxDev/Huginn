import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import ReactDOM from "react-dom/client";
import { RouterProvider } from "react-router";
import "./index.css";
import "highlight.js/styles/atom-one-dark.css";
import { enableLogs, type LogArgs, setOnLog } from "@huginn/shared";
import { client } from "@stores/clientStore";
import { PostHogProvider } from "posthog-js/react";
import router from "./routes";

const root = document.getElementById("root");

// document.addEventListener("keypress", (e) => {
// 	console.log(e.key);
// 	if (e.key === "\\") {
// 		client?.gateway.socket?.close();
// 	}
// 	if (e.key === "]") {
// 		client?.voice.socket?.close();
// 	}
// });

enableLogs({
	"api:voice": ["default", "send", "recv", "heartbeat"],
	"app:voice-store": ["remote-sources"],
	"app:voice-client": ["voice-recv"],
	"api:gateway": ["default", "send", "recv", "heartbeat"],
	"api:client": ["ready-state"],
	"app:client-store": ["default"],
});

const logs: Array<{ section: string; level: string; args: LogArgs[] }> = [];

setOnLog(async (section, level, ...args) => {
	logs.push({ section, level, args });
});

setInterval(async () => {
	if (logs.length !== 0) {
		await client?.log.sendLog(logs);
		logs.splice(0, logs.length);
	}
}, 5000);

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

// let lastTime = performance.now();
// let count = 0;
// setInterval(() => {
// 	const currentTime = performance.now();
// 	console.log(count, currentTime - lastTime);
// 	count++;
// 	lastTime = currentTime;
// }, 1000);

// biome-ignore lint/style/noNonNullAssertion: react needs a non nullable root
ReactDOM.createRoot(root!).render(
	<QueryClientProvider client={queryClient}>
		<RouterProvider router={router} />
	</QueryClientProvider>,
);
