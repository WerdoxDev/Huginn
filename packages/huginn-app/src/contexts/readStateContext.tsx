import type { GatewayReadyData, Snowflake } from "@huginn/shared";
import moment from "moment";
import { type ReactNode, createContext } from "react";

type ReadStateContextType = {
	readStates: ReadonlyArray<ContextReadState>;
	updateChannelLastReadState: (channelId: Snowflake, messageId: Snowflake, messageTimestamp: number) => void;
	addChannelToReadStates: (channelId: Snowflake) => void;
	removeChannelFromReadStates: (channelId: Snowflake) => void;
};

export type ContextReadState = { channelId: Snowflake; lastReadMessageId?: Snowflake; lastReadMessageTimestamp: number; unreadCount: number };
const ReadStateContext = createContext<ReadStateContextType>({} as ReadStateContextType);

export function ReadStateProvider(props: { children?: ReactNode }) {
	const client = useClient();
	const [readStates, setReadStates] = useState<ContextReadState[]>([]);
	const { listenEvent } = useEvent();
	const { getCurrentPageMessages } = useMessagesUtils();

	function onReady(d: GatewayReadyData) {
		setReadStates(
			d.readStates.map((x) => ({
				channelId: x.channelId,
				lastReadMessageId: x.lastReadMessageId ?? undefined,
				lastReadMessageTimestamp: moment(x.lastReadMessageTimestamp).valueOf() ?? 0,
				unreadCount: x.unreadCount,
			})),
		);
	}

	function updateChannelLastReadState(channelId: Snowflake, lastReadMessageId: Snowflake, lastReadMessageTimestamp: number) {
		const messages = getCurrentPageMessages(channelId)?.filter((x) => !x.preview);
		if (!messages || !messages.some((x) => x.id === lastReadMessageId)) return;

		const unreadCount = messages.filter((x) => moment(x.timestamp).isAfter(lastReadMessageTimestamp)).length;

		setReadStates((prev) => [
			...prev.filter((x) => x.channelId !== channelId),
			{ channelId, lastReadMessageId: lastReadMessageId, lastReadMessageTimestamp: lastReadMessageTimestamp, unreadCount: unreadCount },
		]);
	}

	function addChannelToReadStates(channelId: Snowflake) {
		setReadStates((prev) => [...prev, { channelId, lastReadMessageId: undefined, lastReadMessageTimestamp: 0, unreadCount: 0 }]);
	}

	function removeChannelFromReadStates(channelId: Snowflake) {
		setReadStates((prev) => prev.filter((x) => x.channelId !== channelId));
	}

	function increaseUnreadCount(channelId: Snowflake) {
		setReadStates((prev) => {
			const readState = prev.find((x) => x.channelId === channelId);
			if (readState) {
				return [...prev.filter((x) => x.channelId !== channelId), { ...readState, unreadCount: readState.unreadCount + 1 }];
			}
			return prev;
		});
	}

	useEffect(() => {
		const unlisten = listenEvent("message_added", (data) => {
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
		<ReadStateContext.Provider value={{ readStates, updateChannelLastReadState, addChannelToReadStates, removeChannelFromReadStates }}>
			{props.children}
		</ReadStateContext.Provider>
	);
}

export function useChannelReadState(channelId: Snowflake) {
	const context = useContext(ReadStateContext);
	return useMemo(() => context.readStates.find((x) => x.channelId === channelId), [context.readStates, channelId]);
}

export function useReadStates() {
	return useContext(ReadStateContext);
}
