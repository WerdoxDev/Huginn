import type { AppChannelMessage } from "@/types";
import type { Snowflake } from "@huginn/shared";
import { type InfiniteData, useQueryClient } from "@tanstack/react-query";

export function useMessagesUtils() {
	const queryClient = useQueryClient();

	function getCurrentPageMessages(channelId: Snowflake) {
		const messages = queryClient.getQueryData<InfiniteData<AppChannelMessage[], { before: string; after: string }>>(["messages", channelId]);
		return messages?.pages.flat();
	}

	return {
		getCurrentPageMessages,
	};
}
