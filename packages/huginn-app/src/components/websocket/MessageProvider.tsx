import { type APIGetChannelMessagesResult, type APIGetUserChannelsResult, type GatewayUserUpdateData, omit } from "@huginn/shared";
import type { APIMessageUser, GatewayMessageCreateData, GatewayPresenceUpdateData } from "@huginn/shared";
import { type InfiniteData, useQueryClient } from "@tanstack/react-query";
import type { ReactNode } from "react";

export default function MessageProvider(props: { children?: ReactNode }) {
	const client = useClient();
	const { user } = useUser();
	const queryClient = useQueryClient();
	const mutation = useCreateDMChannel();
	const { dispatchEvent } = useEvent();
	const { removeTyping: removeTimeout } = useTypings();

	function onMessageCreated(d: GatewayMessageCreateData) {
		const channels = queryClient.getQueryData<APIGetUserChannelsResult>(["channels", "@me"]);
		const thisChannelIndex = channels?.findIndex((x) => x.id === d.channelId) ?? -1;
		const thisChannel = channels?.find((x) => x.id === d.channelId);

		//TODO: Notification stuff goes here

		if (!thisChannel) {
			mutation.mutate({ recipients: [d.author.id], skipNavigation: true });
			return;
		}

		let messageVisible = false;

		queryClient.setQueryData<InfiniteData<APIGetChannelMessagesResult, { before: string; after: string }>>(["messages", d.channelId], (old) => {
			if (!old) return undefined;

			const lastPage = old.pages[old.pages.length - 1];
			const lastParams = old.pageParams[old.pageParams.length - 1];
			// See if the message can be appended to the current page
			if (!lastParams.before && (!lastParams.after || lastPage.some((x) => x.id === thisChannel.lastMessageId))) {
				messageVisible = true;
				return {
					...old,
					pages: [...old.pages.toSpliced(old.pages.length - 1, 1, [...lastPage, d])],
				};
			}

			return old;
		});

		queryClient.setQueryData<APIGetUserChannelsResult>(["channels", "@me"], (data) => {
			if (!data || thisChannelIndex === -1) return undefined;

			return [...data.toSpliced(thisChannelIndex, 1, { ...thisChannel, lastMessageId: d.id })];
		});

		removeTimeout(d.author.id, d.channelId);
		dispatchEvent("message_added", { message: d, visible: messageVisible, self: d.author.id === user?.id });
	}

	function onUserUpdated(data: GatewayUserUpdateData | GatewayPresenceUpdateData) {
		const user = ("id" in data ? omit(data, ["system"]) : data.user) as APIMessageUser;
		if ("status" in data && data.status === "offline") {
			return;
		}

		queryClient.setQueriesData<InfiniteData<APIGetChannelMessagesResult, { before: string; after: string }>>(
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
	}, []);

	return props.children;
}
