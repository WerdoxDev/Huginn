import type { AppChannelMessage, MessageRenderInfo, MessageRendererProps } from "@/types";
import { MessageType, type Snowflake } from "@huginn/shared";
import { useQueryClient, useSuspenseInfiniteQuery } from "@tanstack/react-query";
import clsx from "clsx";
import moment from "moment";
import type { RefObject } from "react";

const topScrollOffset = 100;
const bottomScrollOffset = 100;

export default function ChannelMessages(props: { channelId: Snowflake; messages: AppChannelMessage[] }) {
	const client = useClient();
	const { user } = useUser();
	const queryClient = useQueryClient();
	const sortedMessages = useMemo(
		() =>
			props.messages.toSorted((a, b) => {
				if (a.preview !== b.preview) {
					return a.preview ? 1 : -1; // Move true to the end
				}
				return moment(a.timestamp).isAfter(b.timestamp) ? 1 : -1;
			}),
		[props.messages],
	);

	const { data, fetchNextPage, fetchPreviousPage, isFetchingPreviousPage, isFetchingNextPage, hasNextPage, hasPreviousPage } =
		useSuspenseInfiniteQuery(getMessagesOptions(queryClient, client, props.channelId));

	const { savedScrolls, saveScroll } = useChannelsInfo();
	const { onMessageVisiblityChanged } = useVisibleMessages(props.channelId, sortedMessages);
	const [getContent, setContent, removeContent] = useDynamicRefs<HTMLLIElement>();
	const { listenEvent } = useEvent();

	const readState = useChannelReadState(props.channelId);
	useMessageAcker(props.channelId, props.messages);
	const { firstUnreadMessageId } = useFirstUnreadMessage(props.channelId, sortedMessages);

	const messageRenderInfos = useMemo<MessageRenderInfo[]>(
		() => calculateMessageRenderInfos(),
		[sortedMessages, props.channelId, firstUnreadMessageId, hasPreviousPage],
	);

	const scroll = useRef<HTMLOListElement>(null);
	const previousScrollTop = useRef(-1);
	const previousChannelId = useRef<Snowflake>(undefined);
	const itemsHeight = useRef(0);
	const listHasUpdated = useRef(false);
	const shouldScrollOnNextRender = useRef(false);

	async function onScroll() {
		if (!scroll.current || sortedMessages.length === 0) return;
		saveScroll(props.channelId, scroll.current.scrollTop ?? 0);

		// Scrolling up
		if (scroll.current.scrollTop <= topScrollOffset && !isFetchingPreviousPage && hasPreviousPage && listHasUpdated.current) {
			// Remove the old refs
			if (data.pages.length === 3) {
				for (const message of data.pages[data.pages.length - 1]) {
					removeContent(message.id);
					removeContent(`${message.id}_separator`);
				}
			}

			await fetchPreviousPageExtra();
		}
		// Scrolling down
		else if (
			scroll.current.scrollHeight - scroll.current.clientHeight - scroll.current.scrollTop <= bottomScrollOffset &&
			!isFetchingNextPage &&
			hasNextPage &&
			listHasUpdated.current
		) {
			listHasUpdated.current = false;

			await fetchNextPage();
		}
	}

	async function fetchPreviousPageExtra() {
		if (!scroll.current) {
			return;
		}

		listHasUpdated.current = false;
		await fetchPreviousPage();
		previousScrollTop.current = scroll.current.scrollTop;
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

		scroll.current.scrollTop = scroll.current.scrollHeight - scroll.current.clientHeight;
	}

	function getFullHeight(element?: HTMLLIElement | null) {
		if (!element) {
			return 0;
		}

		const styles = getComputedStyle(element);
		const margin = Number.parseFloat(styles.marginTop) + Number.parseFloat(styles.marginBottom);

		return element.offsetHeight + margin;
	}

	// Listening for new messages
	useEffect(() => {
		const unlisten = listenEvent("message_added", (d) => {
			if (!scroll.current || !d.inVisibleQueryPage) return;
			const scrollOffset = scroll.current.scrollHeight - scroll.current.clientHeight - scroll.current.scrollTop;

			if (d.self || scrollOffset <= 50) {
				// scrollDown();
				shouldScrollOnNextRender.current = true;
			}
		});

		return () => {
			unlisten();
		};
	}, [props.channelId]);

	// Scrolling to saved scroll
	useEffect(() => {
		if (sortedMessages.length === 0) return;

		// checkForExtraSpace();
		if (previousChannelId.current !== props.channelId) {
			if (savedScrolls.has(props.channelId) && scroll.current) {
				const newScroll = savedScrolls.get(props.channelId) ?? 0;
				scroll.current.scrollTop = newScroll;
			} else {
				scrollDown();
			}
			previousChannelId.current = props.channelId;
		}
	}, [sortedMessages]);

	// Doing height calculations
	useEffect(() => {
		if (!scroll.current) return;

		let height = 0;
		for (const message of data.pages[0]) {
			const elementHeight = getFullHeight(getContent(message.id)?.current) + getFullHeight(getContent(`${message.id}_separator`)?.current);
			height += elementHeight;
		}

		// Set previous to -1 so fetching next page doesnt do anything but prev page does.
		if (previousScrollTop.current !== -1) {
			let previousHeight = 0;
			let previousHeightDiff = 0;

			if (data.pages[1]) {
				for (const message of data.pages[1]) {
					const elementHeight = getFullHeight(getContent(message.id)?.current) + getFullHeight(getContent(`${message.id}_separator`)?.current);
					previousHeight += elementHeight;
				}
			}

			previousHeightDiff = itemsHeight.current - previousHeight;
			scroll.current.scrollTop = previousScrollTop.current + (height - previousHeightDiff);
			previousScrollTop.current = -1;
		}

		itemsHeight.current = height;

		listHasUpdated.current = true;
	}, [sortedMessages]);

	// Should scroll check
	useEffect(() => {
		if (!scroll.current || sortedMessages.length === 0) return;

		if (shouldScrollOnNextRender.current) {
			scrollDown();
			shouldScrollOnNextRender.current = false;
		}
	}, [sortedMessages]);

	// Set the first unread message id

	return (
		<div className="relative flex w-full flex-col">
			<ChannelMessageLoadingIndicator isFetchingNextPage={isFetchingNextPage} isFetchingPreviousPage={isFetchingPreviousPage} />
			<ChannelTypingIndicator channelId={props.channelId} />
			<ol className="flex h-full flex-col overflow-y-scroll py-2 pr-0 pb-7" ref={scroll} onScroll={onScroll}>
				{props.messages.length === 0 && (
					<div className="flex h-full w-full items-center justify-center">
						<div className="flex items-center justify-center gap-x-2 rounded-lg bg-background p-2 pr-3 text-text italic underline">
							<IconMingcuteLookDownFill className="size-10" />
							<span>Empty</span>
						</div>
					</div>
				)}
				{!hasPreviousPage && sortedMessages.length !== 0 && (
					<div className="flex h-20 shrink-0 flex-col justify-center">
						<div className="ml-10 text-text/70">
							The beginning of your chat with <span className="font-bold text-text/100">@mamad</span>
						</div>
					</div>
				)}
				{sortedMessages.map((message, i) => (
					<MessageWrapper
						key={message.id}
						message={message}
						renderInfo={messageRenderInfos[i]}
						nextRenderInfo={messageRenderInfos[i + 1]}
						lastRenderInfo={messageRenderInfos[i - 1]}
						onVisibilityChanged={onMessageVisiblityChanged}
						setContent={setContent}
					/>
				))}
			</ol>
		</div>
	);
}

function MessageWrapper(
	props: {
		message: AppChannelMessage;
		setContent: (key: string) => RefObject<HTMLLIElement | null>;
	} & MessageRendererProps,
) {
	return (
		<>
			{props.renderInfo.unread && !props.renderInfo.newDate && (
				<li
					className={clsx(
						"pointer-events-none relative mr-10 ml-2 flex h-px shrink-0 items-center justify-center bg-error/75",
						props.lastRenderInfo ? "my-1" : "mb-1",
					)}
					ref={props.setContent(`${props.message.id}_separator`)}
				>
					<div className="-mr-10 absolute right-0 flex w-10 items-center justify-center rounded-l-md bg-error/75 py-1 font-bold text-white text-xs uppercase">
						new
					</div>
				</li>
			)}
			{!props.message.preview && props.renderInfo.newDate && (
				<li
					className={clsx(
						"relative flex h-0 items-center justify-center text-center font-semibold text-xs",
						props.lastRenderInfo ? "my-5" : "mt-2 mb-5",
						props.renderInfo.unread
							? "mr-10 ml-2 text-error/100 [border-top:thin_solid_rgb(var(--color-error)/0.75)]"
							: "mx-2 text-text/70 [border-top:thin_solid_rgb(var(--color-text)/0.25)]",
					)}
					ref={props.setContent(`${props.message.id}_separator`)}
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
			<MessageRenderer
				renderInfo={props.renderInfo}
				nextRenderInfo={props.nextRenderInfo}
				lastRenderInfo={props.lastRenderInfo}
				onVisibilityChanged={props.onVisibilityChanged}
				ref={props.setContent(props.message.id)}
			/>
		</>
	);
}
