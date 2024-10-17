import type { Snowflake } from "@huginn/shared";
import { useMutation } from "@tanstack/react-query";

export type AddChannelRecipientMutationVars = { channelId: Snowflake; recipientId: Snowflake };

export function useAddChannelRecipient() {
	const client = useClient();

	const mutation = useMutation({
		mutationKey: ["add-channel-recipient"],
		async mutationFn(data: AddChannelRecipientMutationVars) {
			return await client.channels.addRecipient(data.channelId, data.recipientId);
		},
	});

	return mutation;
}
