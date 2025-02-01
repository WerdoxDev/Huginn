import type { AppChannelMessage, MessageRenderInfo, MessageRendererProps } from "@/types";
import { MessageType, type Snowflake, snowflake } from "@huginn/shared";
import { useQueryClient, useSuspenseInfiniteQuery } from "@tanstack/react-query";
import clsx from "clsx";
import moment from "moment";

const topScrollOffset = 100;
const bottomScrollOffset = 100;

export default function ChannelMessages(props: { channelId: Snowflake; messages: AppChannelMessage[] }) {
	const client = useClient();
	const queryClient = useQueryClient();
	const sortedMessages = useMemo(
		() =>
			props.messages.toSorted((a, b) => {
				if (a.preview !== b.preview) {
					return a.preview ? 1 : -1; // Move true to the end
				}
				return moment(snowflake.getTimestamp(a.id)).isAfter(snowflake.getTimestamp(b.id)) ? 1 : -1;
			}),
		[props.messages],
	);

	const { data, fetchNextPage, fetchPreviousPage, isFetchingPreviousPage, isFetchingNextPage, hasNextPage, hasPreviousPage } =
		useSuspenseInfiniteQuery(getMessagesOptions(queryClient, client, props.channelId));

	const { savedScrolls, saveScroll } = useChannelStore();

	const { onMessageVisiblityChanged } = useVisibleMessages(props.channelId, sortedMessages);
	const { setRef } = useDynamicRefs<HTMLLIElement>();
	const { listenEvent } = useEvent();

	useMessageAcker(props.channelId, props.messages);
	const { firstUnreadMessageId } = useFirstUnreadMessage(props.channelId, sortedMessages);

	const messageRenderInfos = useMemo<MessageRenderInfo[]>(
		() => calculateMessageRenderInfos(),
		[sortedMessages, props.channelId, firstUnreadMessageId],
	);

	const scroll = useRef<HTMLOListElement>(null);
	const shouldScrollOnNextRender = useRef(false);
	const lastChannelId = useRef<Snowflake>(undefined);
	const lastScrollTop = useRef<number>(undefined);
	const lastDistanceToBottom = useRef<number>(undefined);
	const lastSeenElement = useRef<{ messageId: Snowflake; height: number; distanceToTop: number }>(null);
	const lastDirection = useRef<"up" | "down" | "none">("none");

	async function onScroll() {
		// console.log("SC");
		if (!scroll.current || sortedMessages.length === 0) return;

		lastScrollTop.current = scroll.current.scrollTop;

		// Scrolling up
		if (scroll.current.scrollTop <= topScrollOffset && !isFetchingPreviousPage && hasPreviousPage) {
			lastDirection.current = "up";
			await fetchPreviousPage();

			saveLastSeenMessage();
		}
		// Scrolling down
		else if (
			scroll.current.scrollHeight - scroll.current.clientHeight - scroll.current.scrollTop <= bottomScrollOffset &&
			!isFetchingNextPage &&
			hasNextPage
		) {
			// listHasUpdated.current = false;
			lastDirection.current = "down";
			await fetchNextPage();
		}
	}

	function calculateMessageRenderInfos(): MessageRenderInfo[] {
		const value = sortedMessages.map((message, i) => {
			const lastMessage: AppChannelMessage | undefined = sortedMessages[i - 1];

			const newDate = (lastMessage && !moment(message.timestamp).isSame(lastMessage?.timestamp, "date")) || (!lastMessage && !hasPreviousPage);
			const newMinute = !moment(message.timestamp).isSame(lastMessage?.timestamp, "minute");
			const newAuthor = message.author.id !== lastMessage?.author.id;
			const exoticType = message.preview ? false : message.type !== MessageType.DEFAULT;
			const unread = firstUnreadMessageId === message.id;

			return { message, newMinute, newDate, newAuthor, exoticType, unread };
		});

		return value;
	}

	function scrollDown() {
		if (!scroll.current) {
			return;
		}

		scroll.current.scrollTo(0, scroll.current.scrollHeight);
		// scroll.current.scrollTop = scroll.current.scrollHeight - scroll.current.clientHeight;
	}

	function saveLastSeenMessage() {
		if (!scroll.current) return;

		// A little trick to preserve the distance between scroll rect top and selected element
		const savedScrollTop = scroll.current.scrollTop;
		scroll.current.scrollTop = 0;

		const messageElement = getFirstChildClosestToTop(scroll.current) as HTMLLIElement;
		if (!messageElement) return;

		lastSeenElement.current = {
			messageId: messageElement.id,
			height: messageElement.clientHeight,
			distanceToTop: savedScrollTop,
		};
	}

	function scrollToLastSeenMessage() {
		if (!lastSeenElement.current || !scroll.current) return;

		const foundMessageElement = [...scroll.current.children].find((x) => x.id === lastSeenElement.current?.messageId) as HTMLLIElement;
		const elementRect = foundMessageElement.getBoundingClientRect();
		const scrollRect = scroll.current.getBoundingClientRect();

		const offset = elementRect.top - scrollRect.top;
		const heightDifference = foundMessageElement.clientHeight - lastSeenElement.current.height;

		scroll.current.scrollTop = offset + lastSeenElement.current.distanceToTop + heightDifference;
	}

	// Calculating scrolltop position after an upward fetch
	useLayoutEffect(() => {
		if (!lastSeenElement.current || !scroll.current || lastDirection.current !== "up" || lastChannelId.current !== props.channelId) {
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
			if (!scroll.current || !d.inVisibleQueryPage) return;
			const scrollOffset = scroll.current.scrollHeight - scroll.current.clientHeight - scroll.current.scrollTop;

			if (d.self || scrollOffset <= 50) {
				shouldScrollOnNextRender.current = true;
			}
		});

		const unlisten2 = listenEvent("message_updated", (d) => {
			if (!scroll.current || !d.inVisibleQueryPage) return;
			const scrollOffset = scroll.current.scrollHeight - scroll.current.clientHeight - scroll.current.scrollTop;

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
			if (savedScrolls.has(props.channelId) && scroll.current) {
				const newScroll = savedScrolls.get(props.channelId) ?? 0;
				scroll.current.scrollTop = newScroll;
			} else {
				scrollDown();
			}
			lastChannelId.current = props.channelId;
		}
	}, [sortedMessages]);

	// Should scroll check
	useEffect(() => {
		if (!scroll.current || sortedMessages.length === 0) return;

		if (shouldScrollOnNextRender.current) {
			scrollDown();
			shouldScrollOnNextRender.current = false;
		}
	}, [sortedMessages]);

	return (
		// <div className="flex h-full w-full flex-col overflow-hidden">
		<>
			<ChannelMessageLoadingIndicator isFetchingNextPage={isFetchingNextPage} isFetchingPreviousPage={isFetchingPreviousPage} />
			<ChannelTypingIndicator channelId={props.channelId} />
			<ol className="flex h-full flex-col-reverse overflow-y-scroll pr-0 pb-7" ref={scroll} onScroll={onScroll}>
				{scroll.current?.scrollHeight === scroll.current?.clientHeight && <div className="h-full shrink" />}
				{props.messages.length === 0 && (
					<div className="flex h-full w-full shrink-0 items-center justify-center">
						<div className="flex items-center justify-center gap-x-2 rounded-lg bg-background p-2 pr-3 text-text italic underline">
							<IconMingcuteLookDownFill className="size-10" />
							<span>Empty</span>
						</div>
					</div>
				)}
				{sortedMessages
					.map((message, i) => (
						<MessageWrapper
							ref={setRef(message.id)}
							key={message.preview ? message.timestamp : ((message.editedTimestamp as string) ?? message.timestamp)}
							message={message}
							renderInfo={messageRenderInfos[i]}
							nextRenderInfo={messageRenderInfos[i + 1]}
							lastRenderInfo={messageRenderInfos[i - 1]}
							onVisibilityChanged={onMessageVisiblityChanged}
						/>
					))
					.toReversed()}

				{!hasPreviousPage && sortedMessages.length !== 0 && (
					<div className="flex h-20 shrink-0 flex-col justify-center">
						<div className="ml-10 text-text/70">
							The beginning of your chat with <span className="font-bold text-text/100">@mamad</span>
						</div>
					</div>
				)}
			</ol>
		</>
		// </div>
	);
}

function MessageWrapper(
	props: {
		message: AppChannelMessage;
	} & MessageRendererProps,
) {
	return (
		<>
			<MessageRenderer
				ref={props.ref}
				renderInfo={props.renderInfo}
				nextRenderInfo={props.nextRenderInfo}
				lastRenderInfo={props.lastRenderInfo}
				onVisibilityChanged={props.onVisibilityChanged}
			/>
			{!props.message.preview && props.renderInfo.newDate && (
				<li
					className={clsx(
						"relative flex h-0 shrink-0 items-center justify-center text-center font-semibold text-xs",
						props.lastRenderInfo ? "my-5" : "mt-2 mb-5",
						props.renderInfo.unread
							? "mr-10 ml-2 text-error/100 [border-top:thin_solid_rgb(var(--color-error)/0.75)]"
							: "mx-2 text-text/70 [border-top:thin_solid_rgb(var(--color-text)/0.25)]",
					)}
				>
					<span className={clsx("bg-tertiary px-2", props.renderInfo.unread && "ml-10")}>
						{moment(props.message.timestamp).format("DD. MMMM YYYY")}
					</span>
					{props.renderInfo.unread && (
						<div className="-mr-8 absolute right-0 flex w-10 items-center justify-center rounded-l-md bg-error/75 py-1 font-bold text-white text-xs uppercase">
							new
						</div>
					)}
				</li>
			)}
			{props.renderInfo.unread && !props.renderInfo.newDate && (
				<li
					className={clsx(
						"pointer-events-none relative mr-10 ml-2 flex h-px shrink-0 items-center justify-center bg-error/75",
						props.lastRenderInfo ? "my-1" : "mb-1",
					)}
				>
					<div className="-mr-10 absolute right-0 flex w-10 items-center justify-center rounded-l-md bg-error/75 py-1 font-bold text-white text-xs uppercase">
						new
					</div>
				</li>
			)}
		</>
	);
}
