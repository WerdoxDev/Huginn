import { ClientReadyState } from "@huginn/api";
import clsx from "clsx";

type Status = "connected" | "disconnected" | "unauthenticated" | "none";
const statusTexts: Record<Status, string> = {
	connected: "connected",
	disconnected: "reconnecting...",
	unauthenticated: "not authenticated",
	none: "connecting...",
};

export default function ConnectionStatus() {
	const client = useClient();
	const { user } = useUser();

	const [connectionState, setConnectionState] = useState<Status>(
		client.gateway.socket?.readyState === 1 && user ? "connected" : client.gateway.socket?.readyState === 1 && !user ? "unauthenticated" : "none",
	);

	useEffect(() => {
		function onReady() {
			setConnectionState("connected");
		}

		function onOpen() {
			setConnectionState("unauthenticated");
		}

		function onClose() {
			setConnectionState("disconnected");
		}

		client.gateway.on("open", onOpen);
		client.gateway.on("close", onClose);
		client.gateway.on("ready", onReady);

		return () => {
			client.gateway.off("open", onOpen);
			client.gateway.off("close", onClose);
			client.gateway.off("ready", onReady);
		};
	}, []);

	return (
		<div className="pointer-events-none ml-2 flex items-center justify-center gap-x-2">
			<div
				className={clsx(
					"h-2 w-2 rounded-full",
					connectionState === "connected" && "bg-success",
					connectionState === "disconnected" && "bg-error",
					connectionState === "none" && "bg-warning",
					connectionState === "unauthenticated" && "bg-success",
				)}
			/>
			<span className="font-medium text-text/80 text-xs uppercase">{statusTexts[connectionState]}</span>
		</div>
	);
}
