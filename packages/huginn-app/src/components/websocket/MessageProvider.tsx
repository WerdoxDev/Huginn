import type { AppChannelMessage } from "@/types";
import { type GatewayUserUpdateData, omit } from "@huginn/shared";
import type {
	APIGetUserChannelsResult,
	APIMessage,
	APIMessageUser,
	GatewayMessageAckData,
	GatewayMessageCreateData,
	GatewayMessageUpdateData,
	GatewayPresenceUpdateData,
	Snowflake,
} from "@huginn/shared";
import { type InfiniteData, useQueryClient } from "@tanstack/react-query";
import type { ReactNode } from "react";

export default function MessageProvider(props: { children?: ReactNode }) {
	const queryClient = useQueryClient();
	const { dispatchEvent } = useEvent();
	const currentChannel = useCurrentChannel();
	const mutation = useCreateDMChannel("create-dm-channel_other");
	const { currentVisibleMessages, updateLastMessageId } = useChannelStore();
	const { user } = useUser();
	const { addChannelToReadStates, setLatestReadMessage } = useReadStates();
	const huginnWindow = useHuginnWindow();

	async function onMessageCreated(d: GatewayMessageCreateData) {
		const channels = queryClient.getQueryData<APIGetUserChannelsResult>(["channels", "@me"]);
		const targetChannel = channels?.find((x) => x.id === d.channelId);
		const newMessage: AppChannelMessage = { ...d, preview: false };

		if (!targetChannel) {
			await mutation.mutateAsync({ recipients: [d.author.id], skipNavigation: true });
			addChannelToReadStates(d.channelId);
			dispatchEvent("message_added", {
				message: newMessage,
				visible: false,
				inLoadedQueryPage: false,
				inVisibleQueryPage: false,
				self: d.author.id === user?.id,
			});
			return;
		}

		let inLoadedQueryPage = false;
		let inVisibleQueryPage = false;

		queryClient.setQueryData<InfiniteData<AppChannelMessage[], { before: string; after: string }>>(["messages", d.channelId], (old) => {
			if (!old) return undefined;

			const lastPage = old.pages[old.pages.length - 1];
			const lastParams = old.pageParams[old.pageParams.length - 1];
			// See if the message can be appended to the current page
			if (!lastParams.before && (!lastParams.after || lastPage.some((x) => x.id === targetChannel?.lastMessageId))) {
				inLoadedQueryPage = true;
				if (targetChannel.id === currentChannel?.id) {
					inVisibleQueryPage = true;
				}

				return {
					...old,
					pages: [...old.pages.toSpliced(old.pages.length - 1, 1, [...lastPage.filter((x) => !x.nonce || x.nonce !== d.nonce), newMessage])],
				};
			}

			return old;
		});

		updateLastMessageId(queryClient, d.channelId, d.id);

		dispatchEvent("message_added", {
			message: newMessage,
			visible:
				currentChannel?.id === d.channelId &&
				currentVisibleMessages.some((x) => x.messageId === currentChannel.lastMessageId) &&
				huginnWindow.focused,
			inLoadedQueryPage: inLoadedQueryPage,
			inVisibleQueryPage: inVisibleQueryPage,
			self: d.author.id === user?.id,
		});
	}

	async function onMessageUpdated(d: GatewayMessageUpdateData) {
		const channels = queryClient.getQueryData<APIGetUserChannelsResult>(["channels", "@me"]);
		const targetChannel = channels?.find((x) => x.id === d.channelId);
		const updatedMessage: AppChannelMessage = { ...d, preview: false };

		if (!targetChannel) {
			return;
		}

		let inLoadedQueryPage = false;
		let inVisibleQueryPage = false;

		queryClient.setQueryData<InfiniteData<AppChannelMessage[], { before: string; after: string }>>(["messages", d.channelId], (old) => {
			if (!old) return undefined;

			const lastPage = old.pages[old.pages.length - 1];
			const lastParams = old.pageParams[old.pageParams.length - 1];
			// See if the message can be appended to the current page
			if (!lastParams.before && (!lastParams.after || lastPage.some((x) => x.id === targetChannel?.lastMessageId))) {
				inLoadedQueryPage = true;
				if (targetChannel.id === currentChannel?.id) {
					inVisibleQueryPage = true;
				}

				return {
					...old,
					pages: [...old.pages.toSpliced(old.pages.length - 1, 1, [...lastPage.filter((x) => x.id !== d.id), updatedMessage])],
				};
			}

			return old;
		});

		updateLastMessageId(queryClient, d.channelId, d.id);

		dispatchEvent("message_updated", {
			message: updatedMessage,
			visible:
				currentChannel?.id === d.channelId &&
				currentVisibleMessages.some((x) => x.messageId === currentChannel.lastMessageId) &&
				huginnWindow.focused,
			inLoadedQueryPage: inLoadedQueryPage,
			inVisibleQueryPage: inVisibleQueryPage,
			self: d.author.id === user?.id,
		});
	}

	function onMessageAck(d: GatewayMessageAckData) {
		if (currentChannel?.id !== d.channelId) {
			setLatestReadMessage(d.channelId, d.messageId);
		}
	}

	function onUserUpdated(data: GatewayUserUpdateData | GatewayPresenceUpdateData) {
		const user = ("id" in data ? omit(data, ["system"]) : data.user) as APIMessageUser;
		if ("status" in data && data.status === "offline") {
			return;
		}

		queryClient.setQueriesData<InfiniteData<AppChannelMessage[], { before: string; after: string }>>(
			{ queryKey: ["messages"] },
			(old) =>
				old && {
					pageParams: old.pageParams,
					pages: old.pages.map((messages) =>
						messages.map((message) => (message.author.id === user.id ? { ...message, author: user } : message)),
					),
				},
		);
	}

	useEffect(() => {
		client.gateway.on("message_create", onMessageCreated);
		client.gateway.on("message_update", onMessageUpdated);
		client.gateway.on("message_ack", onMessageAck);
		client.gateway.on("user_update", onUserUpdated);
		client.gateway.on("presence_update", onUserUpdated);

		return () => {
			client.gateway.off("message_create", onMessageCreated);
			client.gateway.off("message_update", onMessageUpdated);
			client.gateway.off("message_ack", onMessageAck);
			client.gateway.off("user_update", onUserUpdated);
			client.gateway.off("presence_update", onUserUpdated);
		};
	}, [currentChannel, user, currentVisibleMessages, huginnWindow.focused]);

	return props.children;
}
