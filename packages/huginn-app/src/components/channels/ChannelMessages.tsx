import type { MessageRenderInfo } from "@/types";
import { type APIDefaultMessage, type APIGetChannelMessagesResult, MessageType, type Snowflake } from "@huginn/shared";
import { useQueryClient, useSuspenseInfiniteQuery } from "@tanstack/react-query";
import moment from "moment";
import type { RefObject } from "react";

const topScrollOffset = 100;
const bottomScrollOffset = 100;

export default function ChannelMessages(props: { channelId: Snowflake; messages: APIGetChannelMessagesResult }) {
	const client = useClient();
	const queryClient = useQueryClient();

	const { data, fetchNextPage, fetchPreviousPage, isFetchingPreviousPage, isFetchingNextPage, hasNextPage, hasPreviousPage } =
		useSuspenseInfiniteQuery(getMessagesOptions(queryClient, client, props.channelId));

	const channelScroll = useChannelScroll();
	const channelScrollDispatch = useChannelScrollDispatch();
	const [getContent, setContent, removeContent] = useDynamicRefs<HTMLLIElement>();
	const { listenEvent } = useEvent();

	const messageRenderInfos = useMemo<MessageRenderInfo[]>(() => calculateMessageRenderInfos(), [props.messages, props.channelId]);
	const [messageWidths, setMessageWidths] = useState<{ id: Snowflake; width: number }[]>([]);
	const scroll = useRef<HTMLOListElement>(null);
	const previousScrollTop = useRef(-1);
	const itemsHeight = useRef(0);
	const listHasUpdated = useRef(false);
	const shouldScrollOnNextRender = useRef(false);

	async function onScroll() {
		if (!scroll.current) return;
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

			await fetchPrevious();
			// Scrolling down
		} else if (
			scroll.current.scrollHeight - scroll.current.clientHeight - scroll.current.scrollTop <= bottomScrollOffset &&
			!isFetchingNextPage &&
			hasNextPage &&
			listHasUpdated.current
		) {
			listHasUpdated.current = false;
			await fetchNextPage();
		}
	}

	async function fetchPrevious() {
		if (!scroll.current) {
			return;
		}

		listHasUpdated.current = false;
		await fetchPreviousPage();
		previousScrollTop.current = scroll.current.scrollTop;
	}

	function calculateMessageRenderInfos(): MessageRenderInfo[] {
		const value = props.messages.map((message, i) => {
			const lastMessage = props.messages[i - 1];

			const newDate = !moment(message.createdAt).isSame(lastMessage?.createdAt, "date") && !!lastMessage;
			const newMinute = !moment(message.createdAt).isSame(lastMessage?.createdAt, "minute");
			const newAuthor = message.author.id !== lastMessage?.author.id;
			const exoticType = message.type !== MessageType.DEFAULT;

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

	async function checkForExtraSpace() {
		if (!scroll.current) {
			return;
		}

		if (scroll.current.scrollHeight === scroll.current.clientHeight && !isFetchingPreviousPage) {
			await fetchPrevious();
		}
	}

	useEffect(() => {
		checkForExtraSpace();

		if (channelScroll.has(props.channelId) && scroll.current) {
			const newScroll = channelScroll.get(props.channelId) ?? 0;
			scroll.current.scrollTop = newScroll;
		} else {
			scrollDown();
		}

		const unlisten = listenEvent("message_added", (d) => {
			if (!scroll.current || !d.visible) return;
			const scrollOffset = scroll.current.scrollHeight - scroll.current.clientHeight - scroll.current.scrollTop;

			if (d.self || scrollOffset <= 50) {
				shouldScrollOnNextRender.current = true;
			}
		});

		return () => {
			unlisten();
		};
	}, [props.channelId]);

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

		if (shouldScrollOnNextRender.current) {
			scrollDown();
			shouldScrollOnNextRender.current = false;
		}

		itemsHeight.current = height;

		listHasUpdated.current = true;
	}, [props.messages]);

	// useLayoutEffect(() => {
	// 	const widths = data.pages.flat().map((x) => ({ id: x.id, width: document.getElementById(`${x.id}_inner`)?.clientWidth || 0 }));
	// 	setMessageWidths(widths);
	// 	console.log("SET");
	// }, [props.messages, props.channelId]);

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
				{props.messages.map((message, i) => (
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
	message: APIDefaultMessage;
	renderInfo: MessageRenderInfo;
	nextRenderInfo?: MessageRenderInfo;
	lastRenderInfo?: MessageRenderInfo;
	setContent: (key: string) => RefObject<HTMLLIElement>;
}) {
	return (
		<>
			{props.renderInfo.newDate && (
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
