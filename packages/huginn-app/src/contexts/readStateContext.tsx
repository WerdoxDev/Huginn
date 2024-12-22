import type { GatewayReadyData, Snowflake } from "@huginn/shared";
import moment from "moment";
import { type ReactNode, createContext } from "react";

type ReadStateContextType = {
	lastReadMessages: ReadonlyArray<ContextReadState>;
	updateChannelLastReadMessage: (channelId: Snowflake, messageId: Snowflake, timestamp: number) => void;
	addChannelToReadStates: (channelId: Snowflake) => void;
	removeChannelFromReadStates: (channelId: Snowflake) => void;
};

export type ContextReadState = { channelId: Snowflake; lastReadMessageId?: Snowflake; lastReadMessageTimestamp: number; unreadCount: number };
const ReadStateContext = createContext<ReadStateContextType>({} as ReadStateContextType);

export function ReadStateProvider(props: { children?: ReactNode }) {
	const client = useClient();
	const [lastReadMessages, setLastReadMessages] = useState<ContextReadState[]>([]);
	const { listenEvent } = useEvent();
	const { getCurrentPageMessages } = useMessagesUtils();

	function onReady(d: GatewayReadyData) {
		setLastReadMessages(
			d.readStates.map((x) => ({
				channelId: x.channelId,
				lastReadMessageId: x.lastReadMessageId ?? undefined,
				lastReadMessageTimestamp: moment(x.lastReadTimestamp).valueOf() ?? 0,
				unreadCount: x.unreadCount,
			})),
		);
	}

	function updateChannelLastReadMessage(channelId: Snowflake, lastReadMessageId: Snowflake, lastReadMessageTimestamp: number) {
		const messages = getCurrentPageMessages(channelId)?.filter((x) => !x.preview);
		console.log(messages);
		if (!messages || !messages.some((x) => x.id === lastReadMessageId)) return;

		const unreadCount = messages.filter((x) => moment(x.timestamp).isAfter(lastReadMessageTimestamp)).length;

		setLastReadMessages((prev) => [
			...prev.filter((x) => x.channelId !== channelId),
			{ channelId, lastReadMessageId: lastReadMessageId, lastReadMessageTimestamp: lastReadMessageTimestamp, unreadCount: unreadCount },
		]);
	}

	function addChannelToReadStates(channelId: Snowflake) {
		setLastReadMessages((prev) => [...prev, { channelId, lastReadMessageId: undefined, lastReadMessageTimestamp: 0, unreadCount: 0 }]);
	}

	function removeChannelFromReadStates(channelId: Snowflake) {
		setLastReadMessages((prev) => prev.filter((x) => x.channelId !== channelId));
	}

	function increaseUnreadCount(channelId: Snowflake) {
		setLastReadMessages((prev) => {
			const readState = prev.find((x) => x.channelId === channelId);
			console.log(readState);
			if (readState) {
				return [...prev.filter((x) => x.channelId !== channelId), { ...readState, unreadCount: readState.unreadCount + 1 }];
			}
			return prev;
		});
	}

	useEffect(() => {
		const unlisten = listenEvent("message_added", (data) => {
			console.log(data);
			if (!data.self && !data.visible) {
				increaseUnreadCount(data.message.channelId);
			}
		});

		client.gateway.on("ready", onReady);

		return () => {
			client.gateway.off("ready", onReady);
			unlisten();
		};
	}, []);

	return (
		<ReadStateContext.Provider value={{ lastReadMessages, updateChannelLastReadMessage, addChannelToReadStates, removeChannelFromReadStates }}>
			{props.children}
		</ReadStateContext.Provider>
	);
}

export function useSingleReadState(channelId: Snowflake) {
	const context = useContext(ReadStateContext);
	return useMemo(() => context.lastReadMessages.find((x) => x.channelId === channelId), [context.lastReadMessages, channelId]);
}

export function useReadStates() {
	return useContext(ReadStateContext);
}
