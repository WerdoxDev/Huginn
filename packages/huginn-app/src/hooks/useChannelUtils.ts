import type { APIGetUserChannelsResult, Snowflake } from "@huginn/shared";
import { useQueryClient } from "@tanstack/react-query";

function useChannelUtils() {
	const queryClient = useQueryClient();

	function updateLastMessageId(channelId: Snowflake, messageId: Snowflake) {
		queryClient.setQueryData<APIGetUserChannelsResult>(["channels", "@me"], (data) => {
			if (!data) return undefined;

			const channel = data.find((x) => x.id === channelId);
			if (!channel) return data;

			return [{ ...channel, lastMessageId: messageId }, ...data.filter((x) => x.id !== channelId)];
		});
	}

	return { updateLastMessageId };
}

export default useChannelUtils;
