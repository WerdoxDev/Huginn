import { ChannelType, type DirectChannel, type Snowflake } from "@huginn/shared";
import type { UseMutationResult } from "@tanstack/react-query";

export function useSafeDeleteDMChannel(channelId?: Snowflake, channelType?: DirectChannel["type"], channelName?: string) {
	const mutation = useDeleteDMChannel();
	const modalsDispatch = useModalsDispatch();

	function tryMutate() {
		if (!channelId) {
			return;
		}

		if (channelType === ChannelType.GROUP_DM) {
			modalsDispatch({
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
								modalsDispatch({ info: { isOpen: false } });
							},
						},
						cancel: { text: "Cancel" },
					},
				},
			});
		} else {
			mutation.mutate(channelId);
		}
	}
	return { tryMutate };
}
