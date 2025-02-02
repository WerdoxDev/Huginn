import { ChannelType, type Snowflake } from "@huginn/shared";
import type { RefObject } from "react";

export default function UnreadChannel(props: { channelId: Snowflake; unreadCount: number; className?: string; ref?: RefObject<HTMLDivElement> }) {
	const channel = useChannel(props.channelId);
	const channelName = useChannelName(channel?.recipients, channel?.name);
	const navigateToChannel = useNavigateToChannel();

	if (!channel) {
		return null;
	}

	return (
		<Tooltip placement="right">
			<Tooltip.Trigger className="relative mt-3 flex items-center rounded-lg" onClick={() => navigateToChannel("@me", channel.id)}>
				{channel.type === ChannelType.DM ? (
					<UserAvatar userId={channel.recipients[0]?.id} avatarHash={channel.recipients[0]?.avatar} size="3rem" hideStatus />
				) : (
					<ChannelIcon channelId={channel?.id} iconHash={channel?.icon} size="3rem" />
				)}
				<div className="absolute right-0 bottom-0 h-5 w-5 rounded-full bg-error font-bold text-sm">
					<div className="text-white">{props.unreadCount}</div>
				</div>
			</Tooltip.Trigger>
			<Tooltip.Content>{channelName}</Tooltip.Content>
		</Tooltip>
	);
}
