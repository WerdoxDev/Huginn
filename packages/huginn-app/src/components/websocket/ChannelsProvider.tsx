import {
	type APIChannelUser,
	type APIGetUserChannelsResult,
	ChannelType,
	type GatewayDMCHannelRecipientAddData,
	type GatewayDMCHannelRecipientRemoveData,
	type GatewayDMChannelCreateData,
	type GatewayDMChannelDeleteData,
	type GatewayDMChannelUpdateData,
	type GatewayPresenceUpdateData,
} from "@huginn/shared";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate, useRouter } from "@tanstack/react-router";
import type { ReactNode } from "react";

export default function ChannelsProvider(props: { children?: ReactNode }) {
	const client = useClient();
	const queryClient = useQueryClient();
	const navigate = useNavigate();
	const router = useRouter();

	function onChannelCreated(d: GatewayDMChannelCreateData) {
		queryClient.setQueryData<APIGetUserChannelsResult>(["channels", "@me"], (old) => (old && !old.some((x) => x.id === d.id) ? [d, ...old] : old));
	}

	function onChannelDeleted(d: GatewayDMChannelDeleteData) {
		if (router.state.location.pathname.includes(d.id)) {
			navigate({ to: "/channels/@me", replace: true });
		}

		queryClient.setQueryData<APIGetUserChannelsResult>(["channels", "@me"], (old) => old?.filter((x) => x.id !== d.id));
	}

	function onChannelUpdated(d: GatewayDMChannelUpdateData) {
		queryClient.setQueryData<APIGetUserChannelsResult>(["channels", "@me"], (old) => old?.map((channel) => (channel.id === d.id ? d : channel)));
	}

	function onChannelRecipientAdded(d: GatewayDMCHannelRecipientAddData) {
		queryClient.setQueryData<APIGetUserChannelsResult>(["channels", "@me"], (old) =>
			old?.map((channel) => (channel.id === d.channelId ? { ...channel, recipients: [...channel.recipients, d.user] } : channel)),
		);
	}

	function onChannelRecipientRemoved(d: GatewayDMCHannelRecipientRemoveData) {
		queryClient.setQueryData<APIGetUserChannelsResult>(["channels", "@me"], (old) =>
			old?.map((channel) =>
				channel.id === d.channelId ? { ...channel, recipients: channel.recipients.filter((x) => x.id !== d.user.id) } : channel,
			),
		);
	}

	function onPresenceUpdated(presence: GatewayPresenceUpdateData) {
		const user = presence.user as APIChannelUser;
		if (presence.status === "offline") {
			return;
		}

		queryClient.setQueryData<APIGetUserChannelsResult>(["channels", "@me"], (old) =>
			old?.map((channel) => ({
				...channel,
				recipients: channel.recipients.map((recipient) => (recipient.id === user.id && channel.type === ChannelType.DM ? user : recipient)),
			})),
		);
	}

	useEffect(() => {
		client.gateway.on("channel_create", onChannelCreated);
		client.gateway.on("channel_update", onChannelUpdated);
		client.gateway.on("channel_delete", onChannelDeleted);
		client.gateway.on("channel_recipient_add", onChannelRecipientAdded);
		client.gateway.on("channel_recipient_remove", onChannelRecipientRemoved);
		client.gateway.on("presence_update", onPresenceUpdated);

		return () => {
			client.gateway.off("channel_create", onChannelCreated);
			client.gateway.off("channel_update", onChannelUpdated);
			client.gateway.off("channel_delete", onChannelDeleted);
			client.gateway.off("channel_recipient_add", onChannelRecipientAdded);
			client.gateway.off("channel_recipient_remove", onChannelRecipientRemoved);
			client.gateway.off("presence_update", onPresenceUpdated);
		};
	}, []);

	return props.children;
}
