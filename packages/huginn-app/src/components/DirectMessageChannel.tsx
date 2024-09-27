import { type ContextMenuDMChannel, ContextMenuType } from "@/types";
import { useClient } from "@contexts/apiContext";
import { useContextMenu } from "@contexts/contextMenuContext";
import { useUser } from "@contexts/userContext";
import { useDeleteDMChannel } from "@hooks/mutations/useDeleteDMChannel";
import { useChannelName } from "@hooks/useChannelName";
import type { DirectChannel } from "@huginn/shared";
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
				"hover:bg-background group relative -mr-2 cursor-pointer rounded-md active:bg-white active:bg-opacity-10",
				selected && "bg-white bg-opacity-10",
			)}
			onClick={props.onSelected}
		>
			<Link className="flex items-center p-1.5" to={`/channels/@me/${props.channel.id}`}>
				<UserAvatarWithStatus userId={otherUsers[0].id} avatarHash={otherUsers[0].avatar} className="mr-3" />
				<div className={`text-text w-full text-sm group-hover:opacity-100 ${selected ? "opacity-100" : "opacity-70"}`}>{name}</div>
			</Link>
			{!isLoading ? (
				<button
					type="button"
					className="group/close invisible absolute bottom-3.5 right-2 top-3.5 flex-shrink-0 group-hover:visible"
					onClick={() => {
						mutation.mutate(props.channel.id);
					}}
				>
					<IconMdiClose className="text-text/50 group-hover/close:text-text/100" />
				</button>
			) : (
				<div className="absolute bottom-3.5 right-2 top-3.5 flex-shrink-0 flex justify-center items-center">
					<IconSvgSpinners3DotsFade className="text-text size-7" />
				</div>
			)}
		</li>
	);
}
