import { useChannelName } from "@hooks/api-hooks/channelHooks";
import type { WebsocketStatus } from "@huginn/shared";
import { useClient } from "@stores/apiStore";
import { useThisUser } from "@stores/userStore";
import { useVoiceStore } from "@stores/voiceStore";
import clsx from "clsx";
import { useEffect, useMemo, useState } from "react";
import { NavLink } from "react-router";
import Tooltip from "./tooltip/Tooltip";

const statusTexts: Record<WebsocketStatus, string> = {
	connected: "RTC Signalling...",
	authenticated: "Connected",
	connecting: "RTC Signalling...",
	reconnecting: "Reconnecting...",
	disconnected: "Disconnected",
};

export default function VoiceStatus() {
	const { voiceState } = useVoiceStore();
	const client = useClient();
	const { user } = useThisUser();
	const [status, setStatus] = useState<WebsocketStatus>(client.voice.status);
	const channelName = useChannelName(voiceState.channelId ?? undefined);
	const [rtt, setRtt] = useState(0);

	const latencyColor = useMemo(() => {
		const minPing = 100;
		const maxPing = 2000;

		if (rtt <= minPing) return "hsl(120, 100%, 73%)"; // green
		if (rtt >= maxPing) return "hsl(0, 100%, 73%)"; // red

		const t = (rtt - minPing) / (maxPing - minPing); // 0 to 1

		// Interpolate red and green channels
		const hue = 120 - 120 * t; // 120 (green) → 0 (red)
		return `hsl(${hue}, 100%, 73%)`;
	}, [rtt]);

	// useEffect(() => {
	// 	setState("rtc");
	// }, [voiceState.channelId]);

	useEffect(() => {
		const unlisten = client.voice.listen("status_changed", (status) => {
			console.log(status, "STATUS");
			setStatus(status);
		});
		// setState(client.voice.sendTransport ? "connected" : "rtc");

		// const unlisten = client.voice.listen("send_transport_ready", () => {
		// 	setState("connected");
		// });

		// const unlisten2 = client.voice.listen("connected", () => {
		// 	setState("rtc");
		// });

		// const unlisten3 = client.voice.listen("pong", (d) => {
		// 	setRtt(d.rtt);
		// });

		return () => {
			unlisten();
			// unlisten2();
			// unlisten3();
		};
	}, []);

	async function disconnect() {
		await client.gateway.disconnectVoice();
	}

	if (!user || !voiceState.channelId) {
		return;
	}

	return (
		<div className="w-full p-1">
			<div className="flex h-full w-full items-center rounded-lg bg-background p-2">
				<div className="flex flex-col">
					<div className="flex items-center gap-x-1">
						<Tooltip>
							{status !== "authenticated" ? (
								<IconMingcuteWifiOffLine
									className={clsx(
										"size-6",
										(status === "connecting" || status === "reconnecting" || status === "connected") && "text-warning",
										status === "disconnected" && "text-error",
									)}
								/>
							) : (
								<Tooltip.Trigger className="cursor-default">
									<IconMingcuteWifiLine className="size-6 text-success transition-colors" style={{ color: latencyColor }} />
								</Tooltip.Trigger>
							)}
							<Tooltip.Content extraStyle={{ color: latencyColor }}>{rtt} ms</Tooltip.Content>
						</Tooltip>
						<div
							className={clsx(
								"font-bold text-sm transition-colors",
								(status === "connecting" || status === "reconnecting" || status === "connected") && "!text-warning",
								status === "disconnected" && "!text-error",
							)}
							style={{ color: latencyColor }}
						>
							{statusTexts[status]}
						</div>
					</div>
					<NavLink prefetch="intent" to={`/channels/@me/${voiceState.channelId}`} className="ml-7 text-text/70 text-xs hover:underline">
						{channelName}
					</NavLink>
				</div>
				<div className="ml-auto flex">
					<Tooltip>
						<Tooltip.Trigger onClick={disconnect} className="group rounded-lg p-1.5 text-white transition-colors hover:bg-error/70">
							<IconMingcutePhoneBlockFill className="group-hover:-rotate-12 size-5 transition-transform" />
						</Tooltip.Trigger>
						<Tooltip.Content>Disconnect</Tooltip.Content>
					</Tooltip>
				</div>
			</div>
		</div>
	);
}
