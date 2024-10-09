import type { HuginnClient } from "@huginn/api";
import { type APIGetUserChannelsResult, type Snowflake, resolveBase64, resolveImage } from "@huginn/shared";
import { type QueryClient, infiniteQueryOptions, queryOptions } from "@tanstack/react-query";

export function getChannelsOptions(client: HuginnClient, guildId: Snowflake) {
	return queryOptions({
		queryKey: ["channels", guildId],
		queryFn: () => {
			// FIXME: This needs to change for when guilds are actually a thing
			// if (guildId !== "@me") return undefined;
			return client.channels.getAll();
		},
		initialData: () => client.gateway.readyData?.privateChannels,
	});
}
export function getMessagesOptions(queryClient: QueryClient, client: HuginnClient, channelId: Snowflake, enabled = true) {
	return infiniteQueryOptions({
		queryKey: ["messages", channelId],
		initialPageParam: { before: "", after: "" },
		queryFn: ({ pageParam }) =>
			client.channels.getMessages(channelId, 50, pageParam.before.toString() || undefined, pageParam.after.toString() || undefined),
		getPreviousPageParam(first) {
			const earliestMessage = first[0];
			return earliestMessage && first.length >= 50 ? { before: earliestMessage.id, after: "" } : undefined;
		},
		getNextPageParam(last) {
			const channels: APIGetUserChannelsResult | undefined = queryClient.getQueryData(["channels", "@me"]);
			const thisChannel = channels?.find((x) => x.id === channelId);

			const latestMessage = last[last.length - 1];

			return latestMessage && (!thisChannel || thisChannel.lastMessageId !== latestMessage.id)
				? { after: latestMessage.id, before: "" }
				: undefined;
		},
		maxPages: 2,
		retry: false,
		enabled,
	});
}

export function getRelationshipsOptions(client: HuginnClient) {
	return queryOptions({
		queryKey: ["relationships"],
		queryFn: () => client.relationships.getAll(),
		initialData: () => client.gateway.readyData?.relationships,
	});
}

export function getUserAvatar(userId: Snowflake | undefined, userAvatar: string | null | undefined, client: HuginnClient) {
	return queryOptions({
		queryKey: ["avatar", userId, userAvatar],
		async queryFn() {
			if (!userId || !userAvatar) {
				return null;
			}
			const webp = await resolveImage(client.cdn.avatar(userId, userAvatar));

			if (webp) {
				return resolveBase64(webp);
			}
			const gif = await resolveImage(client.cdn.avatar(userId, userAvatar, { format: "gif" }));
			if (gif) {
				return resolveBase64(gif);
			}

			// const m = userId && userAvatar && resolveBase64(await resolveImage(client.cdn.avatar(userId, userAvatar!)));

			return null;
		},
	});
}
