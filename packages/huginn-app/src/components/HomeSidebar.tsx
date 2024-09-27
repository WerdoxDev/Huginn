import { useClient } from "@contexts/apiContext";
import { useModalsDispatch } from "@contexts/modalContext";
import { useWindow } from "@contexts/windowContext";
import type { APIGetUserChannelsResult } from "@huginn/shared";
import { getMessagesOptions } from "@lib/queries";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import clsx from "clsx";
import DirectMessageChannel from "./DirectMessageChannel";
import RingLinkButton from "./button/RingLinkButton";
import { Tooltip } from "./tooltip/Tooltip";

export default function HomeSidebar(props: { channels?: APIGetUserChannelsResult }) {
	const appWindow = useWindow();
	const dispatch = useModalsDispatch();

	return (
		<nav
			className={clsx("bg-secondary flex h-full flex-col overflow-hidden rounded-l-xl ", appWindow.environment === "browser" && "rounded-tl-none")}
		>
			<div className="flex h-[4.75rem] shrink-0 items-center px-6">
				<div className="text-text text-xl font-bold">Home</div>
				<RingLinkButton to="/friends" className="ml-6 px-2 py-1 text-xs font-medium">
					Friends
				</RingLinkButton>
			</div>
			<div className="h-0.5 shrink-0  bg-white/10" />
			<div className="mx-3.5 mb-3.5 mt-6 flex shrink-0 items-center justify-between  text-xs">
				<div className="text-text/70 hover:text-text/100 font-medium uppercase">Direct Messages</div>
				<Tooltip>
					<Tooltip.Trigger onClick={() => dispatch({ createDM: { isOpen: true } })}>
						<IconMdiPlus className="text-text size-4" />
					</Tooltip.Trigger>
					<Tooltip.Content>Create DM</Tooltip.Content>
				</Tooltip>
			</div>
			<ul className="scroll-alternative2 flex h-full flex-col gap-y-0.5 overflow-y-scroll px-2 pb-2">
				{props.channels?.map((channel) => (
					<DirectMessageChannel key={channel.id} channel={channel} />
				))}
			</ul>
		</nav>
	);
}
