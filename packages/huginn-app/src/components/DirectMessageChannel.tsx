import { useClient } from "@contexts/apiContext";
import { useChannelName } from "@hooks/useChannelName";
import { useSafeDeleteDMChannel } from "@hooks/useSafeDeleteDMChannel";
import { ChannelType, type DirectChannel } from "@huginn/shared";
import { getMessagesOptions } from "@lib/queries";
import { useContextMenu } from "@stores/contextMenuStore";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import clsx from "clsx";
import { useMemo } from "react";
import { NavLink, useParams } from "react-router";
import ChannelIcon from "./ChannelIcon";
import LoadingIcon from "./LoadingIcon";
import UserAvatar from "./UserAvatar";

export default function DirectMessageChannel(props: { channel: DirectChannel; onSelected?: () => void }) {
	const client = useClient();
	const queryClient = useQueryClient();
	const { isLoading } = useInfiniteQuery(getMessagesOptions(queryClient, client, props.channel.id, false));
	const { open: openContextMenu } = useContextMenu("dm_channel");

	const { channelId } = useParams();
	const selected = useMemo(() => channelId === props.channel?.id, [channelId, props.channel]);
	const name = useChannelName(props.channel.recipients, props.channel.name);

	const { tryMutate } = useSafeDeleteDMChannel(props.channel.id, props.channel.type, name);

	return (
		<li
			onContextMenu={(e) => {
				openContextMenu(props.channel, e);
			}}
			className={clsx(
				"group -mr-2 relative cursor-pointer rounded-md hover:bg-background active:bg-white active:bg-opacity-10",
				selected && "bg-white bg-opacity-10",
			)}
			onClick={props.onSelected}
		>
			<NavLink prefetch="intent" className="flex items-center p-1.5" to={`/channels/@me/${props.channel.id}`}>
				{props.channel.type === ChannelType.DM ? (
					<UserAvatar userId={props.channel.recipients[0]?.id} avatarHash={props.channel.recipients[0]?.avatar} className="mr-3" />
				) : (
					<ChannelIcon channelId={props.channel?.id} iconHash={props.channel?.icon} className="mr-3" />
				)}
				<div className="flex w-full flex-col justify-center overflow-hidden">
					<div
						className={clsx(
							"mr-8 overflow-hidden text-ellipsis text-nowrap text-sm text-text group-hover:opacity-100",
							selected ? "opacity-100" : "opacity-70",
						)}
					>
						{name}
					</div>
					{props.channel.type === ChannelType.GROUP_DM && (
						<div className={clsx("text-text text-xs group-hover:opacity-70", selected ? "opacity-70" : "opacity-50")}>
							{props.channel.recipients.length + 1} Members
						</div>
					)}
				</div>
			</NavLink>
			{!isLoading ? (
				<button
					type="button"
					className="group/close invisible absolute top-3.5 right-2 bottom-3.5 flex-shrink-0 group-hover:visible"
					onClick={tryMutate}
				>
					<IconMingcuteCloseFill className="text-text/50 group-hover/close:text-text/100" />
				</button>
			) : (
				<div className="absolute top-3.5 right-2 bottom-3.5 flex flex-shrink-0 items-center justify-center">
					<LoadingIcon className="size-7" />
				</div>
			)}
		</li>
	);
}
