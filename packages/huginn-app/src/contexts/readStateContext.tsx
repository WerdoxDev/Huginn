import type { GatewayReadyData, Snowflake } from "@huginn/shared";
import moment from "moment";
import { type ReactNode, createContext } from "react";

type ReadStateContextType = {
	lastReadMessages: ReadonlyArray<ContextReadState>;
	updateChannelLastReadMessage: (channelId: Snowflake, messageId: Snowflake, timestamp: number) => void;
	getReadState: (channelId: Snowflake) => ContextReadState | undefined;
};

export type ContextReadState = { channelId: Snowflake; messageId?: Snowflake; timestamp: number; unreadCount: number };
const ReadStateContext = createContext<ReadStateContextType>({} as ReadStateContextType);

export function ReadStateProvider(props: { children?: ReactNode }) {
	const client = useClient();
	const [lastReadMessages, setLastReadMessages] = useState<ContextReadState[]>([]);
	const { listenEvent } = useEvent();
	const { getCurrentPageMessages } = useMessages();

	function onReady(d: GatewayReadyData) {
		setLastReadMessages(
			d.readStates.map((x) => ({
				channelId: x.channelId,
				messageId: x.lastReadMessageId ?? undefined,
				timestamp: moment(x.lastReadTimestamp).valueOf() ?? undefined,
				unreadCount: x.unreadCount,
			})),
		);
	}

	function updateChannelLastReadMessage(channelId: Snowflake, messageId: Snowflake, timestamp: number) {
		const messages = getCurrentPageMessages(channelId)?.filter((x) => !x.preview);
		if (!messages || !messages.some((x) => x.id === messageId)) return;

		const unreadCount = messages.filter((x) => moment(x.timestamp).isAfter(timestamp)).length;

		setLastReadMessages((prev) => [
			...prev.filter((x) => x.channelId !== channelId),
			{ channelId, messageId, timestamp, unreadCount: unreadCount },
		]);
	}

	function addUnreadCount(channelId: Snowflake) {
		setLastReadMessages((prev) => {
			const channel = prev.find((x) => x.channelId === channelId);
			if (channel) {
				return [...prev.filter((x) => x.channelId !== channelId), { ...channel, unreadCount: channel.unreadCount + 1 }];
			}
			return prev;
		});
	}

	function getReadState(channelId: Snowflake) {
		return lastReadMessages.find((x) => x.channelId === channelId);
	}

	useEffect(() => {
		const unlisten = listenEvent("message_added", (data) => {
			if (!data.self && !data.visible) {
				addUnreadCount(data.message.channelId);
			}
		});

		client.gateway.on("ready", onReady);

		return () => {
			client.gateway.off("ready", onReady);
			unlisten();
		};
	}, []);

	return (
		<ReadStateContext.Provider value={{ lastReadMessages, updateChannelLastReadMessage, getReadState }}>{props.children}</ReadStateContext.Provider>
	);
}

export function useSingleReadState(channelId: Snowflake) {
	const context = useContext(ReadStateContext);
	return useMemo(() => context.lastReadMessages.find((x) => x.channelId === channelId), [context.lastReadMessages]);
}

export function useReadStates() {
	return useContext(ReadStateContext);
}
