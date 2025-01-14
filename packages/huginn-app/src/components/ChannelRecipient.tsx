import type { APIChannelUser, Snowflake } from "@huginn/shared";
import clsx from "clsx";

export default function ChannelRecipient(props: { channelId: Snowflake; isOwner: boolean; recipient: APIChannelUser }) {
	const presence = usePresence(props.recipient.id);
	const { open: openContextMenu } = useContextMenu("dm_channel_recipient");
	const state = useMutationLatestState("create-dm-channel_recipient");
	return (
		<div
			onContextMenu={(e) => openContextMenu({ channelId: props.channelId, recipient: props.recipient }, e)}
			className="group/recipient relative flex items-center gap-x-3 rounded-lg p-1.5 hover:cursor-pointer hover:bg-background"
		>
			<UserAvatar
				userId={props.recipient.id}
				avatarHash={props.recipient.avatar}
				className={clsx((!presence || presence?.status === "offline") && "opacity-30", "group-hover/recipient:opacity-100")}
			/>
			<div className={clsx(presence?.status === "online" ? "text-text/70" : "text-text/30", "group-hover/recipient:text-text/100")}>
				{props.recipient.displayName ?? props.recipient.username}
			</div>
			{state?.status === "pending" && state?.variables?.recipients.some((x) => x === props.recipient.id) ? (
				<div className="absolute top-3.5 right-2 bottom-3.5 flex flex-shrink-0 items-center justify-center">
					<LoadingIcon className="size-7" />
				</div>
			) : (
				props.isOwner && (
					<Tooltip>
						<Tooltip.Trigger className="mr-2 ml-auto text-success">
							<IconSolarSledgehammerBold className="size-5" />
						</Tooltip.Trigger>
						<Tooltip.Content>Channel Owner</Tooltip.Content>
					</Tooltip>
				)
			)}
		</div>
	);
}
