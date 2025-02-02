import type { AppChannelMessage } from "@/types";
import type { Snowflake } from "@huginn/shared";
import moment from "moment";

export function useVisibleMessages(channelId: Snowflake, sortedMessages: AppChannelMessage[]) {
	const { addVisibleMessage, removeVisibleMessage, clearVisibleMessages } = useChannelStore();

	function onMessageVisiblityChanged(messageId: Snowflake, isVisible: boolean) {
		const foundMessage = sortedMessages.find((x) => x.id === messageId);
		if (!foundMessage) {
			return;
		}
		if (isVisible) {
			addVisibleMessage(foundMessage.id, moment(foundMessage.timestamp).valueOf(), channelId);
		} else {
			removeVisibleMessage(foundMessage.id);
		}
	}

	useEffect(() => {
		return () => {
			clearVisibleMessages();
		};
	}, [channelId]);

	return { onMessageVisiblityChanged };
}
