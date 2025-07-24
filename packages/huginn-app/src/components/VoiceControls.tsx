import { Transition } from "@headlessui/react";
import type { GatewayVoiceState } from "@huginn/shared";
import clsx from "clsx";
import { useMemo } from "react";
import DropdownMenu from "./dropdown/DowndownMenu";
import Tooltip from "./tooltip/Tooltip";

export default function VoiceControls(props: {
	show: boolean;
	isInVoice: boolean;
	isFullscreen: boolean;
	voiceState: GatewayVoiceState;
	onToggleMute: () => void;
	onToggleDeafen: () => void;
	onStartScreenShare: () => void;
	onStartAudioStream: () => void;
	onEndStream: () => void;
	onChangeStream: () => void;
	onStartCamera: () => void;
	onStopCamera: () => void;
	onDisconnect: () => void;
	onConnect: () => void;
	onToggleFullscreen: () => Promise<void>;
}) {
	return (
		<Transition show={props.show}>
			<div className="absolute inset-x-0 bottom-0 mb-2.5 flex shrink-0 items-center justify-center gap-x-2.5 transition data-closed:opacity-0">
				{props.isInVoice ? (
					<>
						<div className="flex gap-x-1 rounded-xl border border-surface bg-surface-deep p-1">
							<Tooltip>
								<Tooltip.Trigger
									className={clsx(
										"h-full w-full rounded-lg px-5 py-1.5 text-white transition-[border-radius_background-color] hover:bg-surface",
										props.voiceState.isAudioMuted && "hover:!bg-negative-500 bg-negative-300",
										props.voiceState.isAudioDeafened && props.voiceState.isAudioMuted && "rounded-r-none",
									)}
									onClick={props.onToggleMute}
								>
									{props.voiceState.isAudioMuted ? (
										<IconMingcuteMicOffFill className="size-6" />
									) : (
										<IconMingcuteMicFill className="size-6" />
									)}
								</Tooltip.Trigger>
								<Tooltip.Content>Mute</Tooltip.Content>
							</Tooltip>
							<Tooltip>
								<Tooltip.Trigger
									className={clsx(
										"h-full w-full rounded-lg px-5 py-1.5 text-white transition-[border-radius_background-color] hover:bg-surface",
										props.voiceState.isAudioDeafened && "hover:!bg-negative-500 bg-negative-300",
										props.voiceState.isAudioDeafened && props.voiceState.isAudioMuted && "rounded-l-none",
									)}
									onClick={props.onToggleDeafen}
								>
									{props.voiceState.isAudioDeafened ? (
										<IconMingcuteVolumeOffFill className="size-6" />
									) : (
										<IconMingcuteVolumeFill className="size-6" />
									)}
								</Tooltip.Trigger>
								<Tooltip.Content>Deafen</Tooltip.Content>
							</Tooltip>
							<div className="mx-0.5 my-1 w-0.5 shrink-0 bg-surface" />
							<div className="flex gap-x-1">
								<StreamButton
									voiceState={props.voiceState}
									onStartScreenShare={props.onStartScreenShare}
									onStartAudioStream={props.onStartAudioStream}
									onEndStream={props.onEndStream}
									onChangeStream={props.onChangeStream}
								/>
								<Tooltip>
									<Tooltip.Trigger
										className={clsx(
											"flex h-full w-16 items-center justify-center rounded-lg text-white transition-colors",
											props.voiceState.isCameraOn ? "bg-primary-900 hover:bg-primary-700" : "hover:bg-surface",
										)}
										onClick={() => (props.voiceState.isCameraOn ? props.onStopCamera() : props.onStartCamera())}
									>
										<IconMingcuteCamera2Fill className="size-6" />
									</Tooltip.Trigger>
									<Tooltip.Content>{props.voiceState.isCameraOn ? "Turn off camera" : "Turn on camera"}</Tooltip.Content>
								</Tooltip>
							</div>
						</div>
						<Tooltip>
							<Tooltip.Trigger
								onClick={props.onDisconnect}
								className="rounded-xl bg-negative-300 px-5 py-2.5 text-white transition-colors hover:bg-negative-500"
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
							className="rounded-xl bg-positive-400 px-5 py-2.5 text-white transition-colors hover:bg-positive-500 focus:bg-positive-600"
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
		</Transition>
	);
}

function StreamButton(props: {
	voiceState: GatewayVoiceState;
	onStartScreenShare?: () => void;
	onStartAudioStream?: () => void;
	onEndStream?: () => void;
	onChangeStream?: () => void;
}) {
	const isStreaming = useMemo(() => props.voiceState.isStreaming, [props.voiceState]);

	return isStreaming ? (
		<div className="flex">
			<Tooltip>
				<Tooltip.Trigger
					className="flex w-[38px] items-center justify-center rounded-lg rounded-r-none bg-primary-900 text-white transition-colors hover:bg-primary-700"
					onClick={props.onEndStream}
				>
					<IconMingcuteCloseFill className="size-6" />
				</Tooltip.Trigger>
				<Tooltip.Content>End Stream</Tooltip.Content>
			</Tooltip>
			<DropdownMenu>
				<DropdownMenu.Button className="ml-0.5 flex h-full items-center justify-center rounded-r-lg bg-primary-900 px-1 transition-colors hover:bg-primary-700">
					{({ open }) => (open ? <IconMingcuteUpFill className="size-4 text-text" /> : <IconMingcuteDownFill className="size-4 text-text" />)}
				</DropdownMenu.Button>
				<DropdownMenu.Items anchor="top" className="border border-surface [--anchor-gap:16px]">
					<DropdownMenu.Item color="negative" label="End Stream" onClick={props.onEndStream} />
					<DropdownMenu.Item label="Change Stream" onClick={props.onChangeStream}>
						<IconMingcuteTransfer3Fill />
					</DropdownMenu.Item>
				</DropdownMenu.Items>
			</DropdownMenu>
		</div>
	) : (
		<DropdownMenu>
			<Tooltip>
				<Tooltip.Trigger
					asChild
					className="flex h-full w-16 items-center justify-center rounded-lg text-white transition-colors hover:bg-surface"
				>
					<DropdownMenu.Button>
						<IconMingcuteMonitorFill className="size-5 shrink-0" />
						<div className="text-sm text-white/50">/</div>
						<IconMingcuteVolumeFill className="size-5 shrink-0" />
					</DropdownMenu.Button>
				</Tooltip.Trigger>
				<Tooltip.Content>Start Stream</Tooltip.Content>
			</Tooltip>
			<DropdownMenu.Items anchor="top" className="border border-surface [--anchor-gap:16px]">
				<DropdownMenu.Item label="Screen Share" onClick={props.onStartScreenShare}>
					<IconMingcuteMonitorFill />
				</DropdownMenu.Item>
				<DropdownMenu.Item label="Audio Stream" onClick={props.onStartAudioStream}>
					<IconMingcuteVolumeFill />
				</DropdownMenu.Item>
			</DropdownMenu.Items>
		</DropdownMenu>
	);
}
