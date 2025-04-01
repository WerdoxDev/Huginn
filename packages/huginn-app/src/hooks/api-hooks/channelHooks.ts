import { queryClient } from "@/root";
import type { AppDirectChannel } from "@/types";
import { useDeleteDMChannel } from "@hooks/mutations/useDeleteDMChannel";
import { type APIGetUserChannelsResult, type APIPublicUser, ChannelType, type DirectChannel, type Snowflake } from "@huginn/shared";
import { useClient } from "@stores/apiStore";
import { useModals } from "@stores/modalsStore";
import { useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
import { useNavigate, useParams } from "react-router";
import { useUsers } from "./userHooks";

export function useChannel(channelId?: Snowflake) {
	const queryClient = useQueryClient();
	const channels = queryClient.getQueryData<AppDirectChannel[]>(["channels", "@me"]);

	return useMemo(() => channels?.find((x) => x.id === channelId), [channels, channelId]);
}

export function useChannelName(channelId?: Snowflake): string {
	const channel = useChannel(channelId);
	const recipients = useUsers(channel?.recipientIds);

	return useMemo(() => (channel?.name ? channel.name : recipients?.map((x) => x.displayName ?? x.username).join(", ")), [channelId, recipients]);
}

export function useChannelNamePlaceholder(recipients: APIPublicUser[]) {
	return useMemo(() => recipients.map((x) => x.displayName ?? x.username).join(", "), [recipients]);
}

export function useChannelRecipients(channelId?: Snowflake, guildId?: Snowflake) {
	const channel = useChannel(channelId);
	const recipients = useUsers(channel?.recipientIds);

	return { recipients, ownerId: channel?.ownerId };
}

export function useCurrentChannel() {
	const { channelId } = useParams<{ channelId: string }>();
	const queryClient = useQueryClient();

	// TODO: CHANGE THIS WHEN GUILDS ARE A THING
	const channels = queryClient.getQueryData<APIGetUserChannelsResult>(["channels", "@me"]);

	return useMemo(() => channels?.find((channel) => channel.id === channelId), [channelId, channels]);
}

export default function useNavigateToChannel() {
	const navigate = useNavigate();

	async function navigateToChannel(guildId: Snowflake, channelId: Snowflake) {
		await navigate(`/channels/${guildId}/${channelId}`);
	}

	return navigateToChannel;
}

export function useSafeDeleteDMChannel(channelId?: Snowflake, channelType?: DirectChannel["type"], channelName?: string) {
	const mutation = useDeleteDMChannel();
	const { updateModals } = useModals();

	function tryMutate() {
		if (!channelId) {
			return;
		}

		if (channelType === ChannelType.GROUP_DM) {
			updateModals({
				info: {
					isOpen: true,
					closable: true,
					title: `Leaving "${channelName}"`,
					status: "default",
					text: `Are you sure you want to leave ${channelName}? You cannot enter the group unless you are invited again.`,
					action: {
						confirm: {
							text: "Leave Group",
							mutationKey: "delete-dm-channel",
							callback: async () => {
								await mutation.mutateAsync(channelId);
								updateModals({ info: { isOpen: false } });
							},
						},
						cancel: {
							text: "Cancel",
							callback: () => {
								updateModals({ info: { isOpen: false } });
							},
						},
					},
				},
			});
		} else {
			mutation.mutate(channelId);
		}
	}
	return { tryMutate };
}
