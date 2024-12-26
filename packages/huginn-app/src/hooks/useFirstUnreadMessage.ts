import type { AppChannelMessage } from "@/types";
import { type Snowflake, snowflake } from "@huginn/shared";
import moment from "moment";

export function useFirstUnreadMessage(channelId: Snowflake, sortedMessages: AppChannelMessage[]) {
	const { user } = useUser();
	const [firstUnreadMessageId, setFirstUnreadMessageId] = useState<Snowflake | undefined>(undefined);
	const readState = useChannelReadState(channelId);
	const { listenEvent } = useEvent();

	useEffect(() => {
		if (!readState?.lastReadMessageId) {
			setFirstUnreadMessageId(sortedMessages[sortedMessages.length - (readState?.unreadCount ?? 1)]?.id);
			return;
		}

		const firstUnreadMessage = sortedMessages
			.filter((x) => x.author.id !== user?.id)
			.find((x) =>
				moment(snowflake.getTimestamp(x.id)).isAfter(
					readState.lastReadMessageId ? snowflake.getTimestamp(readState?.lastReadMessageId) : undefined,
				),
			);

		setFirstUnreadMessageId(firstUnreadMessage?.id);
	}, [channelId]);

	useEffect(() => {
		const unlisten = listenEvent("message_added", (d) => {
			// if the message is not from the user and (the message is not visible or we already read the last message), set the first unread message id
			if (!d.self && d.inLoadedQueryPage && (d.visible || readState?.unreadCount === 0)) {
				setFirstUnreadMessageId(d.message.id);
			} else if (d.self && d.inLoadedQueryPage && d.visible) {
				setFirstUnreadMessageId(undefined);
			}
		});

		return () => {
			unlisten();
		};
	}, [channelId, firstUnreadMessageId, readState]);

	// Cleanup
	useEffect(() => {
		return () => {
			setFirstUnreadMessageId(undefined);
		};
	}, [channelId]);

	return { firstUnreadMessageId };
}
