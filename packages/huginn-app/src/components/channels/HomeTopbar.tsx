import ChannelIcon from "@components/ChannelIcon";
import Tooltip from "@components/tooltip/Tooltip";
import UserAvatar from "@components/UserAvatar";
import { useUser } from "@contexts/userContext";
import { useChannelName } from "@hooks/useChannelName";
import { ChannelType, type DirectChannel } from "@huginn/shared";
import { useMemo } from "react";

export default function HomeTopbar(props: { channel: DirectChannel; onRecipientsClick?: () => void }) {
	const { user } = useUser();
	const name = useChannelName(props.channel.recipients, props.channel.name);

	const otherUsers = useMemo(() => props.channel.recipients.filter((x) => x.id !== user?.id), [props.channel]);

	return (
		<div className="flex h-[4.75rem] flex-shrink-0 items-center bg-tertiary px-6">
			<div className="flex w-full items-center">
				{props.channel.type === ChannelType.DM ? (
					<UserAvatar userId={otherUsers[0]?.id} avatarHash={otherUsers[0]?.avatar} className="mr-3" />
				) : (
					<ChannelIcon channelId={props.channel?.id} iconHash={props.channel?.icon} className="mr-3" />
				)}
				<div className="text-text">{name}</div>
				<div className="ml-auto flex">
					{props.channel.type === ChannelType.GROUP_DM && (
						<Tooltip placement="top">
							<Tooltip.Trigger className="text-text hover:text-text/80" onClick={props.onRecipientsClick}>
								<IconMingcuteGroup2Fill className="size-6" />
							</Tooltip.Trigger>
							<Tooltip.Content>Toggle Members</Tooltip.Content>
						</Tooltip>
					)}
				</div>
			</div>
		</div>
	);
}
