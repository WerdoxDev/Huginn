import type { GatewayVoiceState } from "@huginn/shared";
import { client } from "@stores/apiStore";
import clsx from "clsx";
import Tooltip from "./tooltip/Tooltip";

export default function VoiceControlls(props: {
	isInVoice: boolean;
	isFullscreen: boolean;
	voiceState: GatewayVoiceState;
	onToggleMute: () => void;
	onToggleDeafen: () => void;
	onScreenshare: () => void;
	onDisconnect: () => void;
	onConnect: () => void;
	onToggleFullscreen: () => void;
}) {
	return (
		<div className="absolute inset-x-0 bottom-0 mb-2.5 flex shrink-0 items-center justify-center gap-x-2.5">
			{props.isInVoice ? (
				<>
					<div className="flex gap-x-1 rounded-xl border border-background bg-tertiary p-1">
						<Tooltip>
							<Tooltip.Trigger
								className={clsx(
									"h-full w-full rounded-lg px-5 py-1.5 text-white transition-colors hover:bg-background",
									props.voiceState.selfMute && "bg-error/80 hover:bg-error/60",
								)}
								onClick={props.onToggleMute}
							>
								{props.voiceState.selfMute ? <IconMingcuteMicOffFill className="size-6" /> : <IconMingcuteMicFill className="size-6" />}
							</Tooltip.Trigger>
							<Tooltip.Content>Mute</Tooltip.Content>
						</Tooltip>
						<Tooltip>
							<Tooltip.Trigger
								className={clsx(
									"h-full w-full rounded-lg px-5 py-1.5 text-white transition-colors hover:bg-background",
									props.voiceState.selfDeaf && "bg-error/80 hover:bg-error/60",
								)}
								onClick={props.onToggleDeafen}
							>
								{props.voiceState.selfDeaf ? <IconMingcuteVolumeOffFill className="size-6" /> : <IconMingcuteVolumeFill className="size-6" />}
							</Tooltip.Trigger>
							<Tooltip.Content>Deafen</Tooltip.Content>
						</Tooltip>
						<Tooltip>
							<Tooltip.Trigger
								className={clsx("h-full w-full rounded-lg px-5 py-1.5 text-white transition-colors hover:bg-background")}
								onClick={props.onScreenshare}
							>
								<IconMingcuteMonitorFill className="size-6" />
							</Tooltip.Trigger>
							<Tooltip.Content>Share Screen</Tooltip.Content>
						</Tooltip>
						<Tooltip>
							<Tooltip.Trigger
								className={clsx("h-full w-full rounded-lg px-5 py-1.5 text-white transition-colors hover:bg-background")}
								onClick={() => client.voice.stopScreenSharing()}
							>
								<IconMingcuteMonitorFill className="size-6" />
							</Tooltip.Trigger>
							<Tooltip.Content>Share Screasden</Tooltip.Content>
						</Tooltip>
					</div>
					<Tooltip>
						<Tooltip.Trigger
							onClick={props.onDisconnect}
							className="rounded-xl bg-error/80 px-5 py-2.5 text-white transition-colors hover:bg-error/60"
						>
							<IconMingcutePhoneBlockFill className="size-6" />
						</Tooltip.Trigger>
						<Tooltip.Content>Disconnect</Tooltip.Content>
					</Tooltip>
				</>
			) : (
				<Tooltip>
					<Tooltip.Trigger
						onClick={props.onConnect}
						className="rounded-xl bg-success/80 px-5 py-2.5 text-white transition-colors hover:bg-success/60"
					>
						<IconMingcutePhoneFill className="size-6" />
					</Tooltip.Trigger>
					<Tooltip.Content>Join</Tooltip.Content>
				</Tooltip>
			)}
			<Tooltip>
				<Tooltip.Trigger onClick={props.onToggleFullscreen} className="absolute right-3 bottom-1 size-7 text-text/60 hover:text-text">
					{!props.isFullscreen ? <IconMingcuteFullscreenFill className="size-7" /> : <IconMingcuteFullscreenExitFill className="size-7" />}
				</Tooltip.Trigger>
				<Tooltip.Content>{props.isFullscreen ? "Exit fullscreen" : "Fullscreen"}</Tooltip.Content>
			</Tooltip>
		</div>
	);
}
