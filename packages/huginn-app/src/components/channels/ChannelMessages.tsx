import type { AppChannelMessage, MessageRenderInfo } from "@/types";
import { MessageType, type Snowflake } from "@huginn/shared";
import { useQueryClient, useSuspenseInfiniteQuery } from "@tanstack/react-query";
import moment from "moment";
import type { RefObject } from "react";

const topScrollOffset = 100;
const bottomScrollOffset = 100;

export default function ChannelMessages(props: { channelId: Snowflake; messages: AppChannelMessage[] }) {
	const client = useClient();
	const queryClient = useQueryClient();
	const [sortedMessages, setSortedMessages] = useState<AppChannelMessage[]>([]);

	const { data, fetchNextPage, fetchPreviousPage, isFetchingPreviousPage, isFetchingNextPage, hasNextPage, hasPreviousPage } =
		useSuspenseInfiniteQuery(getMessagesOptions(queryClient, client, props.channelId));

	const channelScroll = useChannelScroll();
	const channelScrollDispatch = useChannelScrollDispatch();
	const [getContent, setContent, removeContent] = useDynamicRefs<HTMLLIElement>();
	const { listenEvent } = useEvent();

	const messageRenderInfos = useMemo<MessageRenderInfo[]>(() => calculateMessageRenderInfos(), [sortedMessages, props.channelId]);
	const scroll = useRef<HTMLOListElement>(null);
	const previousScrollTop = useRef(-1);
	const previousChannelId = useRef<Snowflake>();
	const itemsHeight = useRef(0);
	const listHasUpdated = useRef(false);
	const shouldScrollOnNextRender = useRef(false);

	useEffect(() => {
		setSortedMessages(
			props.messages.toSorted((a, b) => {
				if (a.preview !== b.preview) {
					return a.preview ? 1 : -1; // Move true to the end
				}
				return moment(a.createdAt).unix() - moment(b.createdAt).unix();
			}),
		);
	}, [props.messages]);

	async function onScroll() {
		if (!scroll.current || sortedMessages.length === 0) return;
		channelScrollDispatch({ channelId: props.channelId, scroll: scroll.current.scrollTop ?? 0 });

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

			const newDate = !moment(message.createdAt).isSame(lastMessage?.createdAt, "date") && !!lastMessage;
			const newMinute = !moment(message.createdAt).isSame(lastMessage?.createdAt, "minute");
			const newAuthor = message.author.id !== lastMessage?.author.id;
			const exoticType = message.preview ? false : message.type !== MessageType.DEFAULT;

			return { message, newMinute, newDate, newAuthor, exoticType };
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

	// TODO: I DON'T KNOW WHAT THIS DOES
	// async function checkForExtraSpace() {
	// 	if (!scroll.current) {
	// 		return;
	// 	}

	// 	if (scroll.current.scrollHeight === scroll.current.clientHeight && !isFetchingPreviousPage) {
	// 		// await fetchPrevious();
	// 	}
	// }

	useEffect(() => {
		const unlisten = listenEvent("message_added", (d) => {
			if (!scroll.current || !d.visible) return;
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

	useEffect(() => {
		if (sortedMessages.length === 0) return;

		// checkForExtraSpace();
		// Scrolling to saved scroll
		if (previousChannelId.current !== props.channelId) {
			if (channelScroll.has(props.channelId) && scroll.current) {
				const newScroll = channelScroll.get(props.channelId) ?? 0;
				scroll.current.scrollTop = newScroll;
			} else {
				scrollDown();
			}
			previousChannelId.current = props.channelId;
		}
	}, [sortedMessages]);

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

	useEffect(() => {
		if (!scroll.current || sortedMessages.length === 0) return;

		if (shouldScrollOnNextRender.current) {
			scrollDown();
			shouldScrollOnNextRender.current = false;
		}
	}, [sortedMessages]);

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
				{sortedMessages.map((message, i) => (
					<MessageWrapper
						key={message.id}
						message={message}
						renderInfo={messageRenderInfos[i]}
						nextRenderInfo={messageRenderInfos[i + 1]}
						lastRenderInfo={messageRenderInfos[i - 1]}
						setContent={setContent}
					/>
				))}
			</ol>
		</div>
	);
}

function MessageWrapper(props: {
	message: AppChannelMessage;
	renderInfo: MessageRenderInfo;
	nextRenderInfo?: MessageRenderInfo;
	lastRenderInfo?: MessageRenderInfo;
	setContent: (key: string) => RefObject<HTMLLIElement>;
}) {
	return (
		<>
			{!props.message.preview && props.renderInfo.newDate && (
				<li
					className="mx-2 my-5 flex h-0 items-center justify-center text-center font-semibold text-text/70 text-xs [border-top:thin_solid_rgb(var(--color-text)/0.25)]"
					ref={props.setContent(`${props.message.id}_separator`)}
				>
					<span className="bg-tertiary px-2">{moment(props.message.createdAt).format("DD. MMMM YYYY")}</span>
				</li>
			)}
			<MessageRenderer
				renderInfo={props.renderInfo}
				nextRenderInfo={props.nextRenderInfo}
				lastRenderInfo={props.lastRenderInfo}
				ref={props.setContent(props.message.id)}
			/>
		</>
	);
}
