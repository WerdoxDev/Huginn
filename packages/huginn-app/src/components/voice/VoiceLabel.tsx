import { useUser } from "@hooks/api-hooks/userHooks";
import type { GatewayVoiceState, HMediaKind, Snowflake } from "@huginn/shared";
import clsx from "clsx";
import { motion, type Transition } from "motion/react";

export function VoiceLabel(props: {
	isResizing?: boolean;
	isGridView?: boolean;
	kind?: HMediaKind;
	transition: Transition;
	userId: Snowflake;
	voiceState?: GatewayVoiceState;
}) {
	const user = useUser(props.userId);

	return (
		<>
			<motion.div
				layout={!props.isResizing ? "position" : false}
				transition={props.transition}
				className="absolute bottom-2 left-2 z-10 flex overflow-hidden text-white"
			>
				<div
					className={clsx(
						"flex h-8 items-center justify-center gap-x-2 rounded-lg bg-negative-300",
						(props.voiceState?.isAudioMuted || props.voiceState?.isAudioDeafened) && "mr-2 px-2 py-1",
					)}
				>
					{props.voiceState?.isAudioMuted && <IconMingcuteMicOffFill className="size-5" />}
					{props.voiceState?.isAudioDeafened && <IconMingcuteVolumeOffFill className="size-5" />}
				</div>
				{props.isGridView && (
					<div className="flex items-center justify-center gap-x-2 rounded-lg bg-surface-deep px-2 py-1 text-white opacity-0 transition-opacity group-hover/wrapper:opacity-100">
						{props.kind === "stream_video" ? (
							<IconMingcuteMonitorFill className="size-5" />
						) : props.kind === "stream_audio" ? (
							<IconMingcuteVolumeFill className="size-5" />
						) : (
							props.kind === "camera" && <IconMingcuteCamera2Fill className="size-5" />
						)}
						{user?.displayName ?? user?.username}
					</div>
				)}
			</motion.div>
			{!props.isGridView && (
				<motion.div
					layout={!props.isResizing}
					transition={props.transition}
					className={clsx(
						"-bottom-10 absolute w-full overflow-hidden text-ellipsis text-nowrap text-center text-text opacity-0 transition-opacity group-hover/element:opacity-100",
					)}
				>
					{user?.displayName ?? user?.username}
				</motion.div>
			)}
		</>
	);
}
