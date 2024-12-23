import type { AppChannelMessage } from "@/types";
import type { Snowflake } from "@huginn/shared";
import moment from "moment";

export function useVisibleMessages(channelId: Snowflake, sortedMessages: AppChannelMessage[]) {
	const { setCurrentVisibleMessages } = useChannelsInfo();

	function onMessageVisiblityChanged(messageId: Snowflake, isVisible: boolean) {
		const foundMessage = sortedMessages.find((x) => x.id === messageId);
		if (!foundMessage) {
			return;
		}
		if (isVisible) {
			setCurrentVisibleMessages((old) => [
				...old,
				{ messageId, messageTimestamp: moment(foundMessage.timestamp).valueOf(), channelId: channelId },
			]);
		} else {
			setCurrentVisibleMessages((old) => old.filter((x) => x.messageId !== messageId));
		}
	}

	useEffect(() => {
		return () => {
			setCurrentVisibleMessages([]);
		};
	}, [channelId]);

	return { onMessageVisiblityChanged };
}
