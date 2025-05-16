import type { APIPublicUser, GatewayVoiceState } from "@huginn/shared";
import clsx from "clsx";
import UserAvatar from "./UserAvatar";

export default function VoiceUser(props: {
	user: APIPublicUser;
	voiceState?: GatewayVoiceState;
	speaking?: boolean;
	ringing?: boolean;
	isGridView: boolean;
	gridElementWidth: number;
}) {
	return (
		<div
			className={clsx(
				"group relative flex shrink-0 flex-col items-center justify-center gap-y-1 rounded-xl shadow-md transition-shadow hover:shadow-xl",
				props.isGridView && "aspect-video p-0",
			)}
			style={props.isGridView ? { width: props.gridElementWidth } : undefined}
		>
			<div
				className={clsx(
					"rounded-xl bg-background p-5",
					props.ringing && "animate-pulse",
					props.speaking && "rounded-full ring-2 ring-success",
					props.isGridView && "flex h-full w-full items-center justify-center",
				)}
			>
				<UserAvatar userId={props.user.id} avatarHash={props.user.avatar} size={props.isGridView ? "5rem" : "4rem"} hideStatus />
			</div>
			<div className={clsx("absolute flex items-center gap-x-2", props.isGridView ? "bottom-2 left-2" : "-bottom-4 -left-1")}>
				<div className={clsx("left-0 rounded-lg bg-tertiary px-2 py-1 text-white", props.isGridView ? "block" : "hidden")}>
					{props.user.displayName ?? props.user.username}
				</div>
				{(props.voiceState?.selfMute || props.voiceState?.selfDeaf) && (
					<div className={clsx("flex gap-x-2 rounded-lg bg-error p-1.5")}>
						{props.voiceState?.selfMute && <IconMingcuteMicOffFill className="size-4 text-white" />}
						{props.voiceState?.selfDeaf && <IconMingcuteVolumeOffFill className="size-4 text-white" />}
					</div>
				)}
			</div>
			<div
				className={clsx(
					"-bottom-10 absolute w-full overflow-hidden text-ellipsis text-nowrap text-center text-text opacity-0 transition-opacity group-hover:opacity-100",
					props.isGridView && "hidden",
				)}
			>
				{props.user.displayName ?? props.user.username}
			</div>
		</div>
	);
}
