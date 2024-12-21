import type { APIGetUserChannelsResult, Snowflake } from "@huginn/shared";
import { useQueryClient } from "@tanstack/react-query";

function useChannels() {
	const queryClient = useQueryClient();

	function updateLastMessageId(channelId: Snowflake, messageId: Snowflake) {
		queryClient.setQueryData<APIGetUserChannelsResult>(["channels", "@me"], (data) => {
			if (!data) return undefined;

			const channel = data.find((x) => x.id === channelId);
			if (!channel) return data;

			return [...data.filter((x) => x.id !== channelId), { ...channel, lastMessageId: messageId }];
		});
	}

	return { updateLastMessageId };
}

export default useChannels;
