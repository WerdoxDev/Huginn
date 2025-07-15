import { MessageProvider } from "@contexts/messageProvider";
import { useChannelName, useCurrentChannel } from "@hooks/api-hooks/channelHooks";
import { useMessageAcker } from "@hooks/mutations/useMessageAcker";
import { useDynamicRefs } from "@hooks/useDynamicRefs";
import { useFirstUnreadMessage } from "@hooks/useFirstUnreadMessage";
import { useVisibleMessages } from "@hooks/useVisibleMessages";
import { MessageType, type Snowflake, snowflake } from "@huginn/shared";
import { listenEvent } from "@lib/event-handler";
import { getMessagesOptions } from "@lib/queries";
import { getFirstChildClosestToBottom, getFirstChildClosestToTop } from "@lib/utils";
import { useChannelStore } from "@stores/channelStore";
import { useClient } from "@stores/clientStore";
import { useQueryClient, useSuspenseInfiniteQuery } from "@tanstack/react-query";
import moment from "moment";
import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import type { AppMessage, MessageRenderInfo } from "@/types";
import ChannelMessageLoadingIndicator from "./ChannelMessageLoadingIndicator";
import ChannelTypingIndicator from "./ChannelTypingIndicator";

const topScrollOffset = 100;
const bottomScrollOffset = 100;

export default function ChannelMessages(props: { channelId: Snowflake; messages: AppMessage[] }) {
	const client = useClient();
	const queryClient = useQueryClient();
	const sortedMessages = useMemo(
		() =>
			props.messages.toSorted((a, b) => {
				if (a.preview !== b.preview) {
					return a.preview ? 1 : -1; // Move previews to the end
				}
				return moment(snowflake.getTimestamp(a.id)).isAfter(snowflake.getTimestamp(b.id)) ? 1 : -1;
			}),
		[props.messages],
	);

	const { data, fetchNextPage, fetchPreviousPage, isFetchingPreviousPage, isFetchingNextPage, hasNextPage, hasPreviousPage } =
		useSuspenseInfiniteQuery(getMessagesOptions(queryClient, client, props.channelId));

	const { savedScrolls, saveScroll } = useChannelStore();

	const { onMessageVisibilityChanged } = useVisibleMessages(props.channelId, sortedMessages);
	const { setRef } = useDynamicRefs<HTMLLIElement>();

	useMessageAcker(props.channelId, props.messages);
	const { firstUnreadMessageId } = useFirstUnreadMessage(props.channelId, sortedMessages);

	const messageRenderInfos = useMemo<MessageRenderInfo[]>(
		() => calculateMessageRenderInfos(),
		[sortedMessages, props.channelId, firstUnreadMessageId],
	);

	const scrollRef = useRef<HTMLDivElement>(null);
	const listRef = useRef<HTMLOListElement>(null);
	const shouldScrollOnNextRender = useRef(false);
	const shouldAnchorToBottom = useRef(false);
	const lastChannelId = useRef<Snowflake>(undefined);
	const lastScrollTop = useRef<number>(undefined);
	const lastDistanceToBottom = useRef<number>(undefined);
	const lastSeenElement = useRef<{ messageId: Snowflake; height: number; distanceToTop: number; distanceToBottom: number }>(null);
	const lastDirection = useRef<"up" | "down" | "none">("none");
	const isResizing = useRef(false);
	const currentChannel = useCurrentChannel();
	const channelName = useChannelName(currentChannel?.id);

	async function onScroll() {
		if (!scrollRef.current || sortedMessages.length === 0) return;
		lastScrollTop.current = scrollRef.current.scrollTop;

		// This is to not reevaluate wether or not we are at the bottom when we scroll because of anchoring on resize
		if (!isResizing.current) {
			shouldAnchorToBottom.current = scrollRef.current.scrollHeight - scrollRef.current.clientHeight - scrollRef.current.scrollTop <= 20;
		} else {
			isResizing.current = false;
		}

		// Scrolling up
		if (scrollRef.current.scrollTop <= topScrollOffset && !isFetchingPreviousPage && hasPreviousPage) {
			lastDirection.current = "up";
			await fetchPreviousPage();

			saveLastSeenMessage();
		}
		// Scrolling down
		else if (
			scrollRef.current.scrollHeight - scrollRef.current.clientHeight - scrollRef.current.scrollTop <= bottomScrollOffset &&
			!isFetchingNextPage &&
			hasNextPage
		) {
			lastDirection.current = "down";
			await fetchNextPage();

			saveLastSeenMessage();
		}
	}

	function calculateMessageRenderInfos(): MessageRenderInfo[] {
		const value = sortedMessages.map((message, i) => {
			const lastMessage: AppMessage | undefined = sortedMessages[i - 1];

			const newDate = (lastMessage && !moment(message.timestamp).isSame(lastMessage?.timestamp, "date")) || (!lastMessage && !hasPreviousPage);
			const newMinute = !moment(message.timestamp).isSame(lastMessage?.timestamp, "minute");
			const newAuthor = message.authorId !== lastMessage?.authorId;
			const exoticType = message.preview ? false : message.type !== MessageType.DEFAULT;
			const unread = firstUnreadMessageId === message.id;

			return { message, newMinute, newDate, newAuthor, exoticType, unread };
		});

		return value;
	}

	function scrollDown() {
		if (!scrollRef.current) {
			return;
		}

		scrollRef.current.scrollTo(0, scrollRef.current.scrollHeight);
	}

	function saveLastSeenMessage() {
		if (!scrollRef.current || !listRef.current) return;

		const messageElement = (
			lastDirection.current === "up" ? getFirstChildClosestToTop(listRef.current) : getFirstChildClosestToBottom(listRef.current)
		) as HTMLLIElement;
		if (!messageElement) return;

		lastSeenElement.current = {
			messageId: messageElement.id,
			height: messageElement.clientHeight,
			distanceToTop: scrollRef.current.scrollTop,
			distanceToBottom: scrollRef.current.scrollHeight - scrollRef.current.scrollTop - scrollRef.current.clientHeight - 28,
		};
	}

	function scrollToLastSeenMessage() {
		if (!lastSeenElement.current || !scrollRef.current || !listRef.current) return;

		const foundMessageElement = [...listRef.current.children].find((x) => x.id === lastSeenElement.current?.messageId) as HTMLLIElement;

		foundMessageElement.scrollIntoView({ behavior: "instant", block: lastDirection.current === "up" ? "start" : "end" });
		const heightDifference = foundMessageElement.clientHeight - lastSeenElement.current.height;
		scrollRef.current.scrollTop +=
			(lastDirection.current === "up" ? lastSeenElement.current.distanceToTop : -lastSeenElement.current.distanceToBottom) + heightDifference;
	}

	// Calculating scroll top position after an upward fetch
	useLayoutEffect(() => {
		if (!lastSeenElement.current || !scrollRef.current || lastChannelId.current !== props.channelId) {
			return;
		}

		scrollToLastSeenMessage();
	}, [data]);

	useEffect(() => {
		// clearLoadedImages();
		lastDistanceToBottom.current = undefined;
		saveScroll(lastChannelId.current ?? props.channelId, lastScrollTop.current ?? 0);
		lastDirection.current = "none";

		return () => {
			saveScroll(lastChannelId.current ?? props.channelId, lastScrollTop.current ?? 0);
			// clearLoadedImages();
		};
	}, [props.channelId]);

	// Listening for new messages
	useEffect(() => {
		const unlisten = listenEvent("message_added", (d) => {
			if (!scrollRef.current || !d.inVisibleQueryPage) return;
			const scrollOffset = scrollRef.current.scrollHeight - scrollRef.current.clientHeight - scrollRef.current.scrollTop;

			if (d.self || scrollOffset <= 50) {
				shouldScrollOnNextRender.current = true;
			}
		});

		const unlisten2 = listenEvent("message_updated", (d) => {
			if (!scrollRef.current || !d.inVisibleQueryPage) return;
			const scrollOffset = scrollRef.current.scrollHeight - scrollRef.current.clientHeight - scrollRef.current.scrollTop;

			if (scrollOffset <= 50) {
				shouldScrollOnNextRender.current = true;
			}
		});

		return () => {
			unlisten();
			unlisten2();
		};
	}, [props.channelId]);

	// Scrolling to saved scroll
	useEffect(() => {
		if (sortedMessages.length === 0) return;

		// checkForExtraSpace();
		if (lastChannelId.current !== props.channelId) {
			if (savedScrolls.has(props.channelId) && scrollRef.current) {
				const newScroll = savedScrolls.get(props.channelId) ?? 0;
				scrollRef.current.scrollTop = newScroll;
			} else {
				scrollDown();
			}
			lastChannelId.current = props.channelId;
		}
	}, [sortedMessages]);

	// Should scroll check
	useEffect(() => {
		if (!scrollRef.current || sortedMessages.length === 0) return;

		if (shouldScrollOnNextRender.current) {
			scrollDown();
			shouldScrollOnNextRender.current = false;
		}
	}, [sortedMessages]);

	useEffect(() => {
		if (!scrollRef.current) return;

		const unlisten = listenEvent("message_box_height_changed", (d) => {
			if (!scrollRef.current) return;

			if (scrollRef.current.scrollHeight - scrollRef.current.clientHeight - scrollRef.current.scrollTop >= 1) {
				scrollRef.current.scrollTop += d.difference;
			}
		});

		const resizeObserver = new ResizeObserver((entries) => {
			if (!scrollRef.current) return;
			const scrollHeight = entries[0].target.scrollHeight;

			if (shouldAnchorToBottom.current) {
				isResizing.current = true;
				scrollRef.current.scrollTo(0, scrollHeight);
			}
		});

		resizeObserver.observe(scrollRef.current);

		return () => {
			resizeObserver.disconnect();
			unlisten();
		};
	}, []);

	return (
		<div className="relative h-full overflow-y-hidden">
			<ChannelMessageLoadingIndicator isFetchingNextPage={isFetchingNextPage} isFetchingPreviousPage={isFetchingPreviousPage} />
			<ChannelTypingIndicator channelId={props.channelId} />
			<div className="h-full w-full overflow-x-hidden overflow-y-scroll [overflow-anchor:none]" ref={scrollRef} onScroll={onScroll}>
				<div className="flex min-h-full flex-col justify-end">
					<ol className="min-h-0 overflow-hidden pr-0 pb-7" ref={listRef}>
						{sortedMessages.length === 0 && (
							<div className="flex h-full w-full shrink-0 items-center justify-center">
								<div className="flex items-center justify-center gap-x-2 rounded-lg bg-surface p-2 pr-3 text-text italic underline">
									<IconMingcuteLookDownFill className="size-10" />
									<span>Empty</span>
								</div>
							</div>
						)}
						{!hasPreviousPage && sortedMessages.length !== 0 && (
							<div className="flex h-20 shrink-0 flex-col justify-center">
								<div className="ml-10 text-text/70">
									The beginning of your chat with <span className="font-bold text-text">{channelName}</span>
								</div>
							</div>
						)}
						{sortedMessages.map((message, i) => (
							<MessageProvider
								ref={setRef(message.id)}
								key={message.preview ? message.timestamp : message.id}
								renderInfo={messageRenderInfos[i]}
								nextRenderInfo={messageRenderInfos[i + 1]}
								lastRenderInfo={messageRenderInfos[i - 1]}
								onVisibilityChanged={onMessageVisibilityChanged}
							/>
						))}
					</ol>
				</div>
			</div>
		</div>
	);
}
