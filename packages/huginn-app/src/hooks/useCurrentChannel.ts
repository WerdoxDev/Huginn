import type { APIGetUserChannelsResult } from "@huginn/shared";
import { useQueryClient } from "@tanstack/react-query";
import { useParams } from "react-router";

export function useCurrentChannel() {
	const { channelId } = useParams<{ channelId: string }>();
	const queryClient = useQueryClient();

	// TODO: CHANGE THIS WHEN GUILDS ARE A THING
	const channels = queryClient.getQueryData<APIGetUserChannelsResult>(["channels", "@me"]);

	return useMemo(() => channels?.find((channel) => channel.id === channelId), [channelId, channels]);
}
