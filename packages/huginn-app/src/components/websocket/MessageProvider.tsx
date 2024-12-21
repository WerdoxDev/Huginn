import type { AppChannelMessage } from "@/types";
import { type APIGetUserChannelsResult, type GatewayUserUpdateData, omit } from "@huginn/shared";
import type { APIMessageUser, GatewayMessageCreateData, GatewayPresenceUpdateData } from "@huginn/shared";
import { type InfiniteData, useQueryClient } from "@tanstack/react-query";
import type { ReactNode } from "react";

export default function MessageProvider(props: { children?: ReactNode }) {
	const client = useClient();
	const { user } = useUser();
	const queryClient = useQueryClient();
	const currentChannel = useCurrentChannel();
	const { updateLastMessageId } = useChannels();
	const { addMessageToCurrentQueryPage } = useMessages();
	const { visibleMessages } = useChannelMeta();

	function onMessageCreated(d: GatewayMessageCreateData) {
		addMessageToCurrentQueryPage(d);
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
	}, [currentChannel, user, visibleMessages]);

	return props.children;
}
