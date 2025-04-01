import type { AppDirectChannel } from "@/types";
import type {
	APIChannelUser,
	APIGetUserChannelsResult,
	GatewayDMCannelRecipientRemoveData,
	GatewayDMChannelCreateData,
	GatewayDMChannelDeleteData,
	GatewayDMChannelRecipientAddData,
	GatewayDMChannelUpdateData,
	GatewayPresenceUpdateData,
} from "@huginn/shared";
import { convertToAppDirectChannel } from "@lib/utils";
import { useClient } from "@stores/apiStore";
import { useReadStates } from "@stores/readStatesStore";
import { useQueryClient } from "@tanstack/react-query";
import { type ReactNode, useEffect } from "react";
import { useLocation, useNavigate } from "react-router";

export default function ChannelsProvider(props: { children?: ReactNode }) {
	const client = useClient();
	const queryClient = useQueryClient();
	const navigate = useNavigate();
	const location = useLocation();
	const { addChannelToReadStates, removeChannelFromReadStates } = useReadStates();

	function onChannelCreated(d: GatewayDMChannelCreateData) {
		queryClient.setQueryData<AppDirectChannel[]>(["channels", "@me"], (old) =>
			old && !old.some((x) => x.id === d.id) ? [convertToAppDirectChannel(d), ...old] : old,
		);
		addChannelToReadStates(d.id);
	}

	function onChannelDeleted(d: GatewayDMChannelDeleteData) {
		queryClient.setQueryData<AppDirectChannel[]>(["channels", "@me"], (old) => old?.filter((x) => x.id !== d.id));

		if (location.pathname.includes(d.id)) {
			navigate("/channels/@me", { replace: true, flushSync: true });
		}

		removeChannelFromReadStates(d.id);
		queryClient.removeQueries({ queryKey: ["messages", d.id] });
	}

	function onChannelUpdated(d: GatewayDMChannelUpdateData) {
		queryClient.setQueryData<AppDirectChannel[]>(["channels", "@me"], (old) =>
			old?.map((channel) => (channel.id === d.id ? convertToAppDirectChannel(d) : channel)),
		);
	}

	function onChannelRecipientAdded(d: GatewayDMChannelRecipientAddData) {
		queryClient.setQueryData<AppDirectChannel[]>(["channels", "@me"], (old) =>
			old?.map((channel) => (channel.id === d.channelId ? { ...channel, recipientIds: [...channel.recipientIds, d.user.id] } : channel)),
		);
	}

	function onChannelRecipientRemoved(d: GatewayDMCannelRecipientRemoveData) {
		queryClient.setQueryData<AppDirectChannel[]>(["channels", "@me"], (old) =>
			old?.map((channel) =>
				channel.id === d.channelId ? { ...channel, recipientIds: channel.recipientIds.filter((x) => x !== d.user.id) } : channel,
			),
		);
	}

	useEffect(() => {
		client.gateway.on("channel_create", onChannelCreated);
		client.gateway.on("channel_update", onChannelUpdated);
		client.gateway.on("channel_delete", onChannelDeleted);
		client.gateway.on("channel_recipient_add", onChannelRecipientAdded);
		client.gateway.on("channel_recipient_remove", onChannelRecipientRemoved);

		return () => {
			client.gateway.off("channel_create", onChannelCreated);
			client.gateway.off("channel_update", onChannelUpdated);
			client.gateway.off("channel_delete", onChannelDeleted);
			client.gateway.off("channel_recipient_add", onChannelRecipientAdded);
			client.gateway.off("channel_recipient_remove", onChannelRecipientRemoved);
		};
	}, [location]);

	return props.children;
}
