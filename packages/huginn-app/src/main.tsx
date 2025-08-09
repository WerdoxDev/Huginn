import { QueryClient } from "@tanstack/react-query";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router";
import "./index.css";
import "highlight.js/styles/atom-one-dark.css";
import { enableLogs, type LogArgs, setOnLog } from "@huginn/shared";
// import { clientStore } from "@stores/clientStore";
import router from "./routes";

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
   // "api:voice": ["default", "send", "recv", "heartbeat"],
   "api:voice": ["default", "recv"],
   "app:voice-store": ["remote-sources", "default"],
   "app:voice-client": ["voice-recv", "default"],
   // "api:gateway": ["default", "send", "recv", "heartbeat"],
   "api:gateway": ["default", "recv"],
   "api:client": ["ready-state"],
   "app:client-store": ["default"],
});

const logs: Array<{ section: string; level: string; args: LogArgs[] }> = [];

setOnLog(async (section, level, ...args) => {
   logs.push({ section, level, args });
});

// setInterval(async () => {
//    if (logs.length !== 0) {
//       await clientStore.getState().client?.log.sendLog(logs);
//       logs.splice(0, logs.length);
//    }
// }, 5000);

// let lastTime = performance.now();
// let count = 0;
// setInterval(() => {
// 	const currentTime = performance.now();
// 	console.log(count, currentTime - lastTime);
// 	count++;
// 	lastTime = currentTime;
// }, 1000);

createRoot(document.getElementById("root")!).render(<RouterProvider router={router} />);
