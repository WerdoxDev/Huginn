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
				"relative flex shrink-0 flex-col items-center justify-center gap-y-3 rounded-xl p-3 shadow-md transition-shadow hover:shadow-xl",
				props.ringing ? "bg-background/30" : "bg-background",
				props.speaking && "ring-2 ring-success",
				props.isGridView && "aspect-video",
			)}
			style={props.isGridView ? { width: props.gridElementWidth } : undefined}
		>
			<UserAvatar userId={props.user.id} avatarHash={props.user.avatar} hideStatus size="3rem" />
			{(props.voiceState?.selfMute || props.voiceState?.selfDeaf) && (
				<div className="absolute top-2 left-2 flex gap-x-2 rounded-lg bg-error p-1.5">
					{props.voiceState?.selfMute && <IconMingcuteMicOffFill className="size-4 text-white" />}
					{props.voiceState?.selfDeaf && <IconMingcuteVolumeOffFill className="size-4 text-white" />}
				</div>
			)}
			<div className="text-text">{props.user.displayName ?? props.user.username}</div>
		</div>
	);
}
