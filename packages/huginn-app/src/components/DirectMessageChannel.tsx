import { type ContextMenuDMChannel, ContextMenuType } from "@/types";
import { useClient } from "@contexts/apiContext";
import { useContextMenu } from "@contexts/contextMenuContext";
import { useUser } from "@contexts/userContext";
import { useDeleteDMChannel } from "@hooks/mutations/useDeleteDMChannel";
import { useChannelName } from "@hooks/useChannelName";
import { ChannelType, type DirectChannel } from "@huginn/shared";
import { getMessagesOptions } from "@lib/queries";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useParams } from "@tanstack/react-router";
import clsx from "clsx";
import { useMemo } from "react";
import UserAvatarWithStatus from "./UserAvatarWithStatus";

export default function DirectMessageChannel(props: { channel: DirectChannel; onSelected?: () => void }) {
	const { user } = useUser();

	const queryClient = useQueryClient();
	const client = useClient();
	const { isLoading } = useInfiniteQuery(getMessagesOptions(queryClient, client, props.channel.id, false));

	const { open: openContextMenu } = useContextMenu<ContextMenuDMChannel>(ContextMenuType.DM_CHANNEL);

	const mutation = useDeleteDMChannel();

	const { channelId } = useParams({ strict: false });
	const selected = useMemo(() => channelId === props.channel.id, [channelId, props.channel]);
	const otherUsers = useMemo(() => props.channel.recipients.filter((x) => x.id !== user?.id), [props.channel]);
	const name = useChannelName(props.channel.recipients, props.channel.name);

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
			<Link className="flex items-center p-1.5" to={`/channels/@me/${props.channel.id}`}>
				{props.channel.type === ChannelType.DM ? (
					<UserAvatarWithStatus userId={props.channel.recipients[0].id} avatarHash={props.channel.recipients[0].avatar} className="mr-3" />
				) : (
					<div className="mr-3 size-9 shrink-0 rounded-full bg-primary" />
				)}
				<div className="flex w-full flex-col justify-center">
					<div className={clsx("text-sm text-text group-hover:opacity-100", selected ? "opacity-100" : "opacity-70")}>{name}</div>
					{props.channel.type === ChannelType.GROUP_DM && (
						<div className={clsx("text-text text-xs group-hover:opacity-70", selected ? "opacity-70" : "opacity-50")}>
							{props.channel.recipients.length} Members
						</div>
					)}
				</div>
			</Link>
			{!isLoading ? (
				<button
					type="button"
					className="group/close invisible absolute top-3.5 right-2 bottom-3.5 flex-shrink-0 group-hover:visible"
					onClick={() => {
						mutation.mutate(props.channel.id);
					}}
				>
					<IconMdiClose className="text-text/50 group-hover/close:text-text/100" />
				</button>
			) : (
				<div className="absolute top-3.5 right-2 bottom-3.5 flex flex-shrink-0 items-center justify-center">
					<IconSvgSpinners3DotsFade className="size-7 text-text" />
				</div>
			)}
		</li>
	);
}
