import type { AppChannelMessage } from "@/types";
import type { APIGetUserChannelsResult, APIMessage, Snowflake } from "@huginn/shared";
import { type InfiniteData, useQueryClient } from "@tanstack/react-query";

export function useMessages() {
	const queryClient = useQueryClient();
	const { dispatchEvent } = useEvent();
	const currentChannel = useCurrentChannel();
	const mutation = useCreateDMChannel("create-dm-channel_other");
	const { visibleMessages } = useChannelMeta();
	const { user } = useUser();

	function getCurrentPageMessages(channelId: Snowflake) {
		const messages = queryClient.getQueryData<InfiniteData<AppChannelMessage[], { before: string; after: string }>>(["messages", channelId]);
		return messages?.pages.flat();
	}

	function addMessageToCurrentQueryPage(message: APIMessage, canCreateChannel = false) {
		const channels = queryClient.getQueryData<APIGetUserChannelsResult>(["channels", "@me"]);
		const targetChannel = channels?.find((x) => x.id === message.channelId);

		if (!targetChannel) {
			if (!canCreateChannel) return;
			mutation.mutate({ recipients: [message.author.id], skipNavigation: true });
			return;
		}

		let inLoadedQueryPage = false;
		let inVisibleQueryPage = false;
		const newMessage: AppChannelMessage = { ...message, preview: false };

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
			visible: currentChannel?.id === message.channelId && visibleMessages.some((x) => x.messageId === currentChannel.lastMessageId),
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
