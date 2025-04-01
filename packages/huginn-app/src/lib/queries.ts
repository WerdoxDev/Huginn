import type { AppMessage } from "@/types";
import type { HuginnClient } from "@huginn/api";
import { type APIGetUserChannelsResult, type Snowflake, omit, resolveImage } from "@huginn/shared";
import { type QueryClient, infiniteQueryOptions, queryOptions } from "@tanstack/react-query";
import { convertToAppDirectChannel, convertToAppMessage, convertToAppRelationship } from "./utils";

export function getChannelsOptions(client: HuginnClient, guildId: Snowflake) {
	return queryOptions({
		queryKey: ["channels", guildId],
		queryFn: async () =>
			// FIXME: This needs to change for when guilds are actually a thing
			// if (guildId !== "@me") return undefined;
			(await client.channels.getAll()).map((x) => convertToAppDirectChannel(x)),

		initialData: () => client.gateway.readyData?.privateChannels.map((x) => convertToAppDirectChannel(x)),
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
			return messages.map((x) => convertToAppMessage(x));
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
		queryFn: async () => (await client.relationships.getAll()).map((x) => convertToAppRelationship(x)),
		initialData: () => client.gateway.readyData?.relationships.map((x) => convertToAppRelationship(x)),
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
