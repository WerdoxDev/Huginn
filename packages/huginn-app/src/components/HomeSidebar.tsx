import { useClient } from "@contexts/apiContext";
import { useModalsDispatch } from "@contexts/modalContext";
import { useReadStates } from "@contexts/readStateContext";
import { type APIGetUserChannelsResult, RelationshipType, snowflake } from "@huginn/shared";
import { useHuginnWindow } from "@stores/windowStore";
import clsx from "clsx";
import moment from "moment";
import { useMemo } from "react";
import AttentionIndicator from "./AttentionIndicator";
import DirectMessageChannel from "./DirectMessageChannel";
import RingLinkButton from "./button/RingLinkButton";
import Tooltip from "./tooltip/Tooltip";

export default function HomeSidebar(props: { channels?: APIGetUserChannelsResult }) {
	const huginnWindow = useHuginnWindow();
	const dispatch = useModalsDispatch();
	const { friendsNotificationsCount } = useReadStates();

	const sortedChannels = useMemo(
		() =>
			props.channels?.toSorted((a, b) => {
				if (a.lastMessageId && !b.lastMessageId) {
					return moment(snowflake.getTimestamp(a.lastMessageId)).isBefore(snowflake.getTimestamp(b.id)) ? 1 : -1;
				}

				if (!a.lastMessageId && b.lastMessageId) {
					return moment(snowflake.getTimestamp(a.id)).isBefore(snowflake.getTimestamp(b.lastMessageId)) ? 1 : -1;
				}

				if (!a.lastMessageId && !b.lastMessageId) {
					return moment(snowflake.getTimestamp(a.id)).isBefore(snowflake.getTimestamp(b.id)) ? 1 : -1;
				}

				if (a.lastMessageId && b.lastMessageId) {
					return moment(snowflake.getTimestamp(a.lastMessageId)).isBefore(snowflake.getTimestamp(b.lastMessageId)) ? 1 : -1;
				}

				return 0;
			}),
		[props.channels],
	);

	return (
		<nav
			className={clsx(
				"flex h-full flex-col overflow-hidden rounded-l-xl bg-secondary ",
				huginnWindow.environment === "browser" && "rounded-tl-none",
			)}
		>
			<div className="flex h-[4.75rem] shrink-0 items-center px-6">
				<div className="font-bold text-text text-xl">Home</div>
				<div className="relative ml-6">
					<RingLinkButton prefetch="intent" to="/friends" className="px-2.5 py-1 font-medium text-xs">
						Friends
					</RingLinkButton>
					{friendsNotificationsCount !== 0 && (
						<AttentionIndicator className="-right-2.5 -bottom-3">{friendsNotificationsCount}</AttentionIndicator>
					)}
				</div>
			</div>
			<div className="h-0.5 shrink-0 bg-white/10" />
			<div className="mx-3.5 mt-6 mb-3.5 flex shrink-0 items-center justify-between text-xs">
				<div className="font-medium text-text/70 uppercase hover:text-text/100">Direct Messages</div>
				<Tooltip>
					<Tooltip.Trigger onClick={() => dispatch({ createDM: { isOpen: true } })}>
						<IconMingcuteAddFill className="size-4 text-text/80 hover:text-text/100" />
					</Tooltip.Trigger>
					<Tooltip.Content>Create DM</Tooltip.Content>
				</Tooltip>
			</div>
			<ul className="scroll-alternative2 flex h-full flex-col gap-y-0.5 overflow-y-scroll px-2 pb-2">
				{sortedChannels?.map((channel) => (
					<DirectMessageChannel key={channel.id} channel={channel} />
				))}
			</ul>
		</nav>
	);
}
