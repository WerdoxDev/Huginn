import type { AppMessage } from "@/types";
import { type Snowflake, snowflake } from "@huginn/shared";
import { useClient } from "@stores/apiStore";
import { useChannelStore } from "@stores/channelStore";
import { useChannelReadState, useReadStates } from "@stores/readStatesStore";
import { useThisUser } from "@stores/userStore";
import { useHuginnWindow } from "@stores/windowStore";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import moment from "moment";
import { useEffect } from "react";

export function useMessageAcker(channelId: Snowflake, messages: AppMessage[]) {
	const client = useClient();
	const queryClient = useQueryClient();
	const { user } = useThisUser();
	const readState = useChannelReadState(channelId);
	const { currentVisibleMessages } = useChannelStore();
	const { setLatestReadMessage } = useReadStates();
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
				(!readState?.lastReadMessageId ||
					moment(snowflake.getTimestamp(readState.lastReadMessageId)).isBefore(snowflake.getTimestamp(latestMessage.id))) &&
				user?.id !== latestMessage.authorId
			) {
				setLatestReadMessage(channelId, latestMessage.id, queryClient);
				await mutation.mutateAsync({ channelId: channelId, messageId: latestMessage.id });
			}
		}

		trySendAck();
	}, [currentVisibleMessages, huginnWindow.focused, messages]);
}
