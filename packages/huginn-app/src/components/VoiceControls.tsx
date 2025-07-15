import { Transition } from "@headlessui/react";
import type { GatewayVoiceState } from "@huginn/shared";
import { useClient } from "@stores/clientStore";
import { useVoiceStore } from "@stores/voiceStore";
import clsx from "clsx";
import DropdownMenu from "./dropdown/DowndownMenu";
import Tooltip from "./tooltip/Tooltip";

export default function VoiceControls(props: {
	show: boolean;
	isInVoice: boolean;
	isFullscreen: boolean;
	voiceState: GatewayVoiceState;
	onToggleMute: () => void;
	onToggleDeafen: () => void;
	onStream: () => void;
	onEndStream: () => void;
	onDisconnect: () => void;
	onConnect: () => void;
	onToggleFullscreen: () => Promise<void>;
}) {
	const client = useClient();
	const { localVoiceState: voiceState } = useVoiceStore();

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
										props.voiceState.selfMute && "bg-negative-300 hover:!bg-negative-500",
										voiceState.selfDeaf && voiceState.selfMute && "rounded-r-none",
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
										"h-full w-full rounded-lg px-5 py-1.5 text-white transition-[border-radius_background-color] hover:bg-surface",
										props.voiceState.selfDeaf && "bg-negative-300 hover:!bg-negative-500",
										voiceState.selfDeaf && voiceState.selfMute && "rounded-l-none",
									)}
									onClick={props.onToggleDeafen}
								>
									{props.voiceState.selfDeaf ? (
										<IconMingcuteVolumeOffFill className="size-6" />
									) : (
										<IconMingcuteVolumeFill className="size-6" />
									)}
								</Tooltip.Trigger>
								<Tooltip.Content>Deafen</Tooltip.Content>
							</Tooltip>
							<div className="mx-0.5 my-1 w-0.5 shrink-0 bg-surface" />
							<div className="flex">
								<Tooltip>
									<Tooltip.Trigger
										className={clsx(
											"flex h-full items-center justify-center rounded-lg text-white transition-colors",
											voiceState.selfStream ? "!w-[38px] rounded-r-none bg-primary-900 hover:bg-primary-700" : "w-16 hover:bg-surface",
										)}
										onClick={() => (voiceState.selfStream ? props.onEndStream() : props.onStream())}
									>
										<IconMingcuteMonitorFill className="size-6" />
									</Tooltip.Trigger>
									<Tooltip.Content>{voiceState.selfStream ? "End Stream" : "Start Stream"}</Tooltip.Content>
								</Tooltip>
								{voiceState.selfStream && (
									<DropdownMenu>
										<DropdownMenu.Button className="ml-0.5 flex h-full items-center justify-center rounded-r-lg bg-primary-900 px-1 transition-colors hover:bg-primary-700">
											{({ open }) =>
												open ? <IconMingcuteUpFill className="size-4 text-text" /> : <IconMingcuteDownFill className="size-4 text-text" />
											}
										</DropdownMenu.Button>
										<DropdownMenu.Items anchor="top" className="border border-surface [--anchor-gap:16px]">
											<DropdownMenu.Item
												className="!text-negative-100 hover:!bg-negative-500"
												label="End Stream"
												onClick={props.onEndStream}
											/>
											<DropdownMenu.Item label="Change Stream" onClick={props.onStream}>
												<IconMingcuteTransfer3Fill />
											</DropdownMenu.Item>
										</DropdownMenu.Items>
									</DropdownMenu>
								)}
							</div>
							{/* <Tooltip>
							<Tooltip.Trigger
								className={clsx("h-full w-full rounded-lg px-5 py-1.5 text-white transition-colors hover:bg-surface")}
								onClick={() => client.voice.stopScreensharing()}
							>
								<IconMingcuteMonitorFill className="size-6" />
							</Tooltip.Trigger>
							<Tooltip.Content>Stop Sharing</Tooltip.Content>
						</Tooltip> */}
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
