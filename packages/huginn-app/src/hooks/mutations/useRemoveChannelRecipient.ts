import type { Snowflake } from "@huginn/shared";
import { useClient } from "@stores/apiStore";
import { useMutation } from "@tanstack/react-query";

export type RemoveChannelRecipientMutationVars = { channelId: Snowflake; recipientId: Snowflake };

export function useRemoveChannelRecipient() {
	const client = useClient();

	const mutation = useMutation({
		mutationKey: ["remove-channel-recipient"],
		async mutationFn(data: RemoveChannelRecipientMutationVars) {
			return await client.channels.removeRecipient(data.channelId, data.recipientId);
		},
	});

	return mutation;
}
