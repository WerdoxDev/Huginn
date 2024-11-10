import type { APIDMChannel, APIGroupDMChannel, Snowflake } from "@huginn/shared";
import type { QueryClient } from "@tanstack/react-query";
import { redirect } from "@tanstack/react-router";

export function ensureChannelExists(channelId: Snowflake, queryClient: QueryClient) {
	const channels: (APIDMChannel | APIGroupDMChannel)[] | undefined = queryClient.getQueryData(["channels", "@me"]);
	const safePathname = routeHistory.lastPathname?.includes(channelId) ? "/channels/@me" : routeHistory.lastPathname;
	if (!channels?.some((x) => x.id === channelId)) throw redirect({ to: safePathname });
}
