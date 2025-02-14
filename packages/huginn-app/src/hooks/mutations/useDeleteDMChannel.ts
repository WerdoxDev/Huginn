import { useClient } from "@contexts/apiContext";
import type { Snowflake } from "@huginn/shared";
import { useMutation } from "@tanstack/react-query";

export function useDeleteDMChannel() {
	const client = useClient();

	const mutation = useMutation({
		mutationKey: ["delete-dm-channel"],
		async mutationFn(channelId: Snowflake) {
			return await client.channels.deleteDM(channelId);
		},
	});

	return mutation;
}
