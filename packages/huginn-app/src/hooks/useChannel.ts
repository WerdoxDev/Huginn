import type { APIGetUserChannelsResult, Snowflake } from "@huginn/shared";
import { useQueryClient } from "@tanstack/react-query";

export function useChannel(channelId: Snowflake) {
	const queryClient = useQueryClient();
	const channels = queryClient.getQueryData<APIGetUserChannelsResult>(["channels", "@me"]);

	return useMemo(() => channels?.find((x) => x.id === channelId), [channels, channelId]);
}
