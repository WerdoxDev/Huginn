import { type GatewayReadyData, type Snowflake, snowflake } from "@huginn/shared";
import { convertFileSrc } from "@tauri-apps/api/core";
import { join, resourceDir } from "@tauri-apps/api/path";
import { ScheduleEvery } from "@tauri-apps/plugin-notification";
import moment from "moment";
import { type ReactNode, createContext } from "react";

type ReadStateContextType = {
	readStates: ReadonlyArray<ContextReadState>;
	setLatestReadMessage: (channelId: Snowflake, messageId: Snowflake) => void;
	addChannelToReadStates: (channelId: Snowflake) => void;
	removeChannelFromReadStates: (channelId: Snowflake) => void;
};

export type ContextReadState = { channelId: Snowflake; lastReadMessageId?: Snowflake; unreadCount: number };
const ReadStateContext = createContext<ReadStateContextType>({} as ReadStateContextType);

export function ReadStateProvider(props: { children?: ReactNode }) {
	const client = useClient();
	const [readStates, setReadStates] = useState<ContextReadState[]>([]);
	const { listenEvent } = useEvent();
	const { getCurrentPageMessages } = useMessagesUtils();
	const { sendNotification } = useNotification();

	function onReady(d: GatewayReadyData) {
		setReadStates(
			d.readStates.map((x) => ({
				channelId: x.channelId,
				lastReadMessageId: x.lastReadMessageId ?? undefined,
				unreadCount: x.unreadCount,
			})),
		);
	}

	function setLatestReadMessage(channelId: Snowflake, messageId: Snowflake) {
		const messages = getCurrentPageMessages(channelId)?.filter((x) => !x.preview);
		if (!messages || !messages.some((x) => x.id === messageId)) return;

		const unreadCount = messages.filter((x) => moment(snowflake.getTimestamp(x.id)).isAfter(snowflake.getTimestamp(messageId))).length;

		setReadStates((prev) => [
			...prev.filter((x) => x.channelId !== channelId),
			{ channelId, lastReadMessageId: messageId, unreadCount: unreadCount },
		]);
	}

	function addChannelToReadStates(channelId: Snowflake) {
		setReadStates((prev) => [...prev, { channelId, lastReadMessageId: undefined, unreadCount: 0 }]);
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
		const unlisten = listenEvent("message_added", async (data) => {
			if (!data.self && !data.visible) {
				console.log(await join(await resourceDir(), "resources/huginn-text.png"));
				sendNotification(data.message.author.username, data.message.content, await join(await resourceDir(), "resources/huginn-text.png"));
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
		<ReadStateContext.Provider value={{ readStates, setLatestReadMessage, addChannelToReadStates, removeChannelFromReadStates }}>
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
