import { useClient } from "@contexts/apiContext";
import { type APIGetUserChannelsResult, ChannelType, type GatewayDMChannelCreateData, type GatewayPublicUserUpdateData, omit } from "@huginn/shared";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate, useRouter } from "@tanstack/react-router";
import { type ReactNode, useEffect } from "react";

export default function ChannelsProvider(props: { children?: ReactNode }) {
	const client = useClient();
	const queryClient = useQueryClient();
	const navigate = useNavigate();
	const router = useRouter();

	function onChannelCreated(d: GatewayDMChannelCreateData) {
		queryClient.setQueryData<APIGetUserChannelsResult>(["channels", "@me"], (data) =>
			data && !data.some((x) => x.id === d.id) ? [d, ...data] : data,
		);
	}

	function onChannelDeleted(d: GatewayDMChannelCreateData) {
		if (router.state.location.pathname.includes(d.id)) {
			navigate({ to: "/channels/@me", replace: true });
		}

		queryClient.setQueryData<APIGetUserChannelsResult>(["channels", "@me"], (data) => data?.filter((x) => x.id !== d.id));
	}

	function onPublicUserUpdated(newUser: GatewayPublicUserUpdateData) {
		queryClient.setQueryData<APIGetUserChannelsResult>(["channels", "@me"], (old) =>
			old?.map((channel) => ({
				...channel,
				recipients: channel.recipients.map((recipient) =>
					recipient.id === newUser.id && channel.type === ChannelType.DM ? omit(newUser, ["system"]) : recipient,
				),
			})),
		);
	}

	useEffect(() => {
		client.gateway.on("channel_create", onChannelCreated);
		client.gateway.on("channel_delete", onChannelDeleted);
		client.gateway.on("public_user_update", onPublicUserUpdated);

		return () => {
			client.gateway.off("channel_create", onChannelCreated);
			client.gateway.off("channel_delete", onChannelDeleted);
			client.gateway.off("public_user_update", onPublicUserUpdated);
		};
	}, []);

	return props.children;
}
