import type { AppChannelMessage } from "@/types";
import { type GatewayUserUpdateData, omit } from "@huginn/shared";
import type {
	APIGetUserChannelsResult,
	APIMessage,
	APIMessageUser,
	GatewayMessageCreateData,
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
	const { currentVisibleMessages } = useChannelsInfo();
	const { updateLastMessageId } = useChannelUtils();
	const { user } = useUser();
	const { addChannelToReadStates } = useReadStates();
	const appWindow = useWindow();

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
				console.log(targetChannel.id, currentChannel?.id);
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

		dispatchEvent("message_added", {
			message: newMessage,
			visible:
				currentChannel?.id === d.channelId &&
				currentVisibleMessages.some((x) => x.messageId === currentChannel.lastMessageId) &&
				appWindow.focused,
			inLoadedQueryPage: inLoadedQueryPage,
			inVisibleQueryPage: inVisibleQueryPage,
			self: d.author.id === user?.id,
		});

		updateLastMessageId(d.channelId, d.id);
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
		client.gateway.on("user_update", onUserUpdated);
		client.gateway.on("presence_update", onUserUpdated);

		return () => {
			client.gateway.off("message_create", onMessageCreated);
			client.gateway.off("user_update", onUserUpdated);
			client.gateway.off("presence_update", onUserUpdated);
		};
	}, [currentChannel, user, currentVisibleMessages, appWindow.focused]);

	return props.children;
}
