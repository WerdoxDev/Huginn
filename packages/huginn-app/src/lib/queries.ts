import type { AppChannelMessage } from "@/types";
import type { HuginnClient } from "@huginn/api";
import { type APIGetUserChannelsResult, type Snowflake, resolveImage } from "@huginn/shared";
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
		queryFn: async ({ pageParam }) => {
			const messages = await client.channels.getMessages(
				channelId,
				50,
				pageParam.before.toString() || undefined,
				pageParam.after.toString() || undefined,
			);
			return messages.map((x) => ({ ...x, preview: false })) as AppChannelMessage[];
		},
		getPreviousPageParam(first) {
			const earliestMessage = first[0];
			return earliestMessage && first.length >= 50 ? { before: earliestMessage.id, after: "" } : undefined;
		},
		getNextPageParam(last) {
			const channels: APIGetUserChannelsResult | undefined = queryClient.getQueryData(["channels", "@me"]);
			const targetChannel = channels?.find((x) => x.id === channelId);

			const latestMessage = last[last.length - 1];

			return !latestMessage?.preview && latestMessage && (!targetChannel || targetChannel.lastMessageId !== latestMessage.id)
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

export function getUserAvatarOptions(userId: Snowflake | undefined, avatarHash: string | null | undefined, client: HuginnClient) {
	return queryOptions({
		queryKey: ["avatar", userId, avatarHash],
		async queryFn() {
			if (!userId || !avatarHash) {
				return null;
			}

			const data = await resolveImage(client.cdn.avatar(userId, avatarHash));
			return data ? data : null;
		},
	});
}

export function getChannelIconOptions(channelId: Snowflake | undefined, iconHash: string | null | undefined, client: HuginnClient) {
	return queryOptions({
		queryKey: ["channel-icon", channelId, iconHash],
		async queryFn() {
			if (!channelId || !iconHash) {
				return null;
			}

			const data = await resolveImage(client.cdn.channelIcon(channelId, iconHash));
			return data ? data : null;
		},
	});
}
