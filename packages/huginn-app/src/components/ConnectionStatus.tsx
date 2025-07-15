import type { WebsocketStatus } from "@huginn/shared";
import { useClient, useClientStore } from "@stores/clientStore";
import clsx from "clsx";
import { useEffect, useState } from "react";

const statusTexts: Record<WebsocketStatus, string> = {
	connected: "Not Authenticated",
	authenticated: "Authenticated",
	connecting: "Connecting...",
	reconnecting: "Reconnecting...",
	disconnected: "Disconnected",
	none: "Connecting...",
};

export default function ConnectionStatus() {
	const client = useClient();

	const [status, setStatus] = useState<WebsocketStatus>(client.gateway.status);

	useEffect(() => {
		const unlisten = client.gateway.listen("status_changed", (status) => {
			setStatus(status);
		});

		return () => {
			unlisten();
		};
	}, []);

	return (
		<div className="pointer-events-none ml-2 flex items-center justify-center gap-x-2">
			<div
				className={clsx(
					"h-2 w-2 rounded-full",
					status === "authenticated" && "bg-positive-100",
					(status === "disconnected" || status === "reconnecting") && "bg-negative-100",
					(status === "reconnecting" || status === "connecting" || status === "connected" || status === "none") && "bg-caution-100",
				)}
			/>
			<span className="font-medium text-text/80 text-xs uppercase">{statusTexts[status]}</span>
		</div>
	);
}
