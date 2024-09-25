import UserAvatarWithStatus from "@components/UserAvatarWithStatus";
import { useUser } from "@contexts/userContext";
import { useChannelName } from "@hooks/useChannelName";
import { ChannelType, type DirectChannel } from "@huginn/shared";
import { useMemo } from "react";

export default function HomeTopbar(props: { channel: DirectChannel }) {
	const { user } = useUser();
	const name = useChannelName(props.channel.recipients, props.channel.name, 40);

	const otherUsers = useMemo(() => props.channel.recipients.filter((x) => x.id !== user?.id), [props.channel]);

	return (
		<div className="bg-tertiary flex h-[4.75rem] flex-shrink-0 items-center px-6">
			<div className="flex items-center">
				{props.channel.type === ChannelType.DM ? (
					<UserAvatarWithStatus userId={otherUsers[0].id} avatarHash={otherUsers[0].avatar} className="mr-3" />
				) : (
					<div className="bg-background mr-3 size-[2.25rem] rounded-full" />
				)}
				<div className="text-text">{name}</div>
			</div>
		</div>
	);
}
