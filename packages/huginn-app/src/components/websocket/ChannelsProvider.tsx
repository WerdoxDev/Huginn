import type {
	APIChannelUser,
	APIGetUserChannelsResult,
	GatewayDMCHannelRecipientAddData,
	GatewayDMCHannelRecipientRemoveData,
	GatewayDMChannelCreateData,
	GatewayDMChannelDeleteData,
	GatewayDMChannelUpdateData,
	GatewayPresenceUpdateData,
} from "@huginn/shared";
import { useQueryClient } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { useLocation, useNavigate } from "react-router";

export default function ChannelsProvider(props: { children?: ReactNode }) {
	const client = useClient();
	const queryClient = useQueryClient();
	const navigate = useNavigate();
	const location = useLocation();
	const { addChannelToReadStates, removeChannelFromReadStates } = useReadStates();

	function onChannelCreated(d: GatewayDMChannelCreateData) {
		queryClient.setQueryData<APIGetUserChannelsResult>(["channels", "@me"], (old) => (old && !old.some((x) => x.id === d.id) ? [d, ...old] : old));
		addChannelToReadStates(d.id);
	}

	function onChannelDeleted(d: GatewayDMChannelDeleteData) {
		queryClient.setQueryData<APIGetUserChannelsResult>(["channels", "@me"], (old) => old?.filter((x) => x.id !== d.id));

		if (location.pathname.includes(d.id)) {
			navigate("/channels/@me", { replace: true, flushSync: true });
		}

		removeChannelFromReadStates(d.id);
		queryClient.removeQueries({ queryKey: ["messages", d.id] });
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
				recipients: channel.recipients.map((recipient) => (recipient.id === user.id ? user : recipient)),
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
	}, [location]);

	return props.children;
}
