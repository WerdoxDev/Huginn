import type { AppChannelMessage } from "@/types";
import type { APIGetUserChannelsResult, APIMessage, Snowflake } from "@huginn/shared";
import { type InfiniteData, useQueryClient } from "@tanstack/react-query";
import moment from "moment";

export function useMessagesUtils() {
	const queryClient = useQueryClient();
	const { dispatchEvent } = useEvent();
	const currentChannel = useCurrentChannel();
	const mutation = useCreateDMChannel("create-dm-channel_other");
	const { visibleMessages } = useChannelMeta();
	const { user } = useUser();
	const { updateChannelLastReadState: updateChannelLastReadMessage, addChannelToReadStates } = useReadStates();
	const appWindow = useWindow();

	function getCurrentPageMessages(channelId: Snowflake) {
		const messages = queryClient.getQueryData<InfiniteData<AppChannelMessage[], { before: string; after: string }>>(["messages", channelId]);
		return messages?.pages.flat();
	}

	async function addMessageToCurrentQueryPage(message: APIMessage, canCreateChannel = false) {
		const channels = queryClient.getQueryData<APIGetUserChannelsResult>(["channels", "@me"]);
		const targetChannel = channels?.find((x) => x.id === message.channelId);
		const newMessage: AppChannelMessage = { ...message, preview: false };

		if (!targetChannel) {
			if (!canCreateChannel) return;
			await mutation.mutateAsync({ recipients: [message.author.id], skipNavigation: true });
			addChannelToReadStates(message.channelId);
			dispatchEvent("message_added", {
				message: newMessage,
				visible: false,
				inLoadedQueryPage: false,
				inVisibleQueryPage: false,
				self: message.author.id === user?.id,
			});
			return;
		}

		let inLoadedQueryPage = false;
		let inVisibleQueryPage = false;

		queryClient.setQueryData<InfiniteData<AppChannelMessage[], { before: string; after: string }>>(["messages", message.channelId], (old) => {
			if (!old) return undefined;

			const lastPage = old.pages[old.pages.length - 1];
			const lastParams = old.pageParams[old.pageParams.length - 1];
			// See if the message can be appended to the current page
			if (!lastParams.before && (!lastParams.after || lastPage.some((x) => x.id === targetChannel?.lastMessageId))) {
				inLoadedQueryPage = true;
				console.log(targetChannel.id, currentChannel?.id);
				if (targetChannel.id === currentChannel?.id) {
					inVisibleQueryPage = true;
				}

				return {
					...old,
					pages: [
						...old.pages.toSpliced(old.pages.length - 1, 1, [...lastPage.filter((x) => !x.nonce || x.nonce !== message.nonce), newMessage]),
					],
				};
			}

			return old;
		});

		dispatchEvent("message_added", {
			message: newMessage,
			visible:
				currentChannel?.id === message.channelId &&
				visibleMessages.some((x) => x.messageId === currentChannel.lastMessageId) &&
				appWindow.focused,
			inLoadedQueryPage: inLoadedQueryPage,
			inVisibleQueryPage: inVisibleQueryPage,
			self: message.author.id === user?.id,
		});
	}

	return {
		addMessageToCurrentQueryPage,
		getCurrentPageMessages,
	};
}
