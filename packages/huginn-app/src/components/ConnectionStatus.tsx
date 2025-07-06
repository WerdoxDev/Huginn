import type { WebsocketStatus } from "@huginn/shared";
import { useClient } from "@stores/apiStore";
import clsx from "clsx";
import { useEffect, useState } from "react";

const statusTexts: Record<WebsocketStatus, string> = {
	connected: "Not Authenticated",
	authenticated: "Authenticated",
	connecting: "Connecting...",
	reconnecting: "Reconnecting...",
	disconnected: "Disconnected",
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
					status === "authenticated" && "bg-success",
					(status === "disconnected" || status === "reconnecting") && "bg-error",
					(status === "reconnecting" || status === "connecting" || status === "connected") && "bg-warning",
				)}
			/>
			<span className="font-medium text-text/80 text-xs uppercase">{statusTexts[status]}</span>
		</div>
	);
}
