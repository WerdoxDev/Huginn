import type { AppChannelMessage } from "@/types";
import type { Snowflake } from "@huginn/shared";
import { useMutation } from "@tanstack/react-query";
import moment from "moment";

export function useMessageAcker(channelId: Snowflake, messages: AppChannelMessage[]) {
	const client = useClient();
	const { user } = useUser();
	const readState = useChannelReadState(channelId);
	const { currentVisibleMessages } = useChannelStore();
	const { updateChannelLastReadState } = useReadStates();
	const huginnWindow = useHuginnWindow();

	const mutation = useMutation({
		async mutationFn(data: { channelId: Snowflake; messageId: Snowflake }) {
			await client.channels.ackMessage(data.channelId, data.messageId);
		},
	});

	useEffect(() => {
		if (!huginnWindow.focused) {
			return;
		}

		async function trySendAck() {
			const latestMessageId = currentVisibleMessages.toSorted((a, b) => a.messageTimestamp - b.messageTimestamp)[currentVisibleMessages.length - 1]
				?.messageId;
			if (!latestMessageId) {
				return;
			}

			const latestMessage = messages.find((x) => x.id === latestMessageId);
			if (!latestMessage) {
				return;
			}

			// if the latest message is from the user or the message is older than the last read message, don't send an ack
			if (
				(!readState?.lastReadMessageId || moment(readState?.lastReadMessageTimestamp).isBefore(latestMessage.timestamp)) &&
				user?.id !== latestMessage.author.id
			) {
				updateChannelLastReadState(channelId, latestMessage.id, moment(latestMessage.timestamp).valueOf());
				await mutation.mutateAsync({ channelId: channelId, messageId: latestMessage.id });
			}
		}

		trySendAck();
	}, [currentVisibleMessages, huginnWindow.focused, messages]);
}
