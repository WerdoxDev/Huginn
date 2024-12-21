import { ChannelType, type Snowflake } from "@huginn/shared";

export default function UnreadChannel(props: { channelId: Snowflake; unreadCount: number }) {
	const channel = useChannel(props.channelId);
	const navigateToChannel = useNavigateToChannel();

	if (!channel) {
		return null;
	}

	return (
		<button
			type="button"
			className="relative mt-3 flex items-center rounded-lg hover:bg-secondary/10"
			onClick={() => navigateToChannel("@me", channel.id)}
		>
			{channel.type === ChannelType.DM ? (
				<UserAvatar userId={channel.recipients[0]?.id} avatarHash={channel.recipients[0]?.avatar} size="3rem" hideStatus />
			) : (
				<ChannelIcon channelId={channel?.id} iconHash={channel?.icon} size="3rem" />
			)}
			<div className="absolute right-0 bottom-0 h-5 w-5 rounded-full bg-error font-bold text-sm">
				<div className="text-white">{props.unreadCount}</div>
			</div>
		</button>
	);
}
