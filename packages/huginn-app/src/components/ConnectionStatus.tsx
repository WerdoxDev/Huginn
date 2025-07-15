import type { WebsocketStatus } from "@huginn/shared";
import { useClient, useClientStore } from "@stores/clientStore";
import clsx from "clsx";
import { useEffect, useState } from "react";

const statusTexts: Record<WebsocketStatus, string> = {
	connected: "Connected - Not Authenticated",
	authenticated: "Connected - Authenticated",
	connecting: "Connecting...",
	reconnecting: "Reconnecting...",
	disconnected: "Disconnected",
	none: "Connecting...",
};

export default function ConnectionStatus() {
	const clientStore = useClientStore();
	const client = useClient();

	const [status, setStatus] = useState<WebsocketStatus | undefined>(client?.gateway.status);

	useEffect(() => {
		if (clientStore.isInitialized) {
			setStatus(client.gateway.status);
		}

		const unlisten = client?.gateway.listen("status_changed", (status) => {
			setStatus(status);
		});

		return () => {
			unlisten?.();
		};
	}, [clientStore.isInitialized]);

	return (
		<div className="pointer-events-none ml-2 flex items-center justify-center gap-x-2">
			<div
				className={clsx(
					"h-2 w-2 rounded-full",
					status === "authenticated" && "bg-positive-100",
					(status === "disconnected" || status === "reconnecting") && "bg-negative-100",
					(status === "reconnecting" || status === "connecting" || status === "none" || !clientStore.isInitialized) && "bg-caution-100",
					status === "connected" && "bg-positive-400",
				)}
			/>
			<span className="font-medium text-text/80 text-xs uppercase">{status ? statusTexts[status] : "Not Initialized"}</span>
			{clientStore.isInitialized && status !== "authenticated" && status !== "connected" && (
				<span className="font-medium text-text/80 text-xs uppercase">via {clientStore.hostnames.api}</span>
			)}
		</div>
	);
}
