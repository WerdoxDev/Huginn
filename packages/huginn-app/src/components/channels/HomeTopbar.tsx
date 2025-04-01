import type { AppDirectChannel } from "@/types";
import ChannelIcon from "@components/ChannelIcon";
import UserAvatar from "@components/UserAvatar";
import Tooltip from "@components/tooltip/Tooltip";
import { useChannelName } from "@hooks/api-hooks/channelHooks";
import { useUsers } from "@hooks/api-hooks/userHooks";
import { ChannelType } from "@huginn/shared";
import { useClient } from "@stores/apiStore";
import { useThisUser } from "@stores/userStore";
import { useMemo } from "react";

export default function HomeTopbar(props: { channel: AppDirectChannel; onRecipientsClick?: () => void }) {
	const { user } = useThisUser();
	const client = useClient();
	const recipients = useUsers(props.channel.recipientIds);
	const name = useChannelName(props.channel.id);

	const otherUsers = useMemo(() => recipients.filter((x) => x.id !== user?.id), [props.channel]);

	async function startCall() {
		await client.gateway.connectToVoice(null, props.channel.id);
	}

	return (
		<div className="flex h-[4.75rem] flex-shrink-0 items-center bg-tertiary px-6">
			<div className="flex w-full items-center">
				{props.channel.type === ChannelType.DM ? (
					<UserAvatar userId={otherUsers[0]?.id} avatarHash={otherUsers[0]?.avatar} className="mr-3" />
				) : (
					<ChannelIcon channelId={props.channel?.id} iconHash={props.channel?.icon} className="mr-3" />
				)}
				<Tooltip>
					<Tooltip.Trigger className="text-text">{name}</Tooltip.Trigger>
					{recipients.length === 1 && <Tooltip.Content>{recipients[0].username}</Tooltip.Content>}
				</Tooltip>
				<div className="ml-auto flex gap-x-5">
					<Tooltip placement="top">
						<Tooltip.Trigger className="text-text/80 hover:text-text" onClick={startCall}>
							<IconMingcutePhoneCallFill className="size-6" />
						</Tooltip.Trigger>
						<Tooltip.Content>Start Call</Tooltip.Content>
					</Tooltip>
					{props.channel.type === ChannelType.GROUP_DM && (
						<Tooltip placement="top">
							<Tooltip.Trigger className="text-text/80 hover:text-text" onClick={props.onRecipientsClick}>
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
