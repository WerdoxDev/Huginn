import type { APIGetUserChannelsResult, Snowflake } from "@huginn/shared";
import type { QueryClient } from "@tanstack/react-query";
import { create } from "zustand";
import { combine } from "zustand/middleware";

export const useChannelStore = create(
	combine(
		{
			savedScrolls: new Map<Snowflake, number>(),
			currentVisibleMessages: [] as Array<{ messageId: Snowflake; messageTimestamp: number; channelId: Snowflake }>,
		},
		(set) => ({
			saveScroll: (channelId: Snowflake, scroll: number) => set((state) => ({ savedScrolls: new Map(state.savedScrolls).set(channelId, scroll) })),
			addVisibleMessage: (id: Snowflake, timestamp: number, channelId: Snowflake) =>
				set((state) => ({
					currentVisibleMessages: [
						...state.currentVisibleMessages.filter((x) => x.messageId !== id),
						{ messageId: id, messageTimestamp: timestamp, channelId: channelId },
					],
				})),
			removeVisibleMessage: (id: Snowflake) =>
				set((state) => ({
					currentVisibleMessages: [...state.currentVisibleMessages.filter((x) => x.messageId !== id)],
				})),
			clearVisibleMessages: () => set({ currentVisibleMessages: [] }),
			updateLastMessageId: (queryClient: QueryClient, channelId: Snowflake, messageId: Snowflake) => {
				queryClient.setQueryData<APIGetUserChannelsResult>(["channels", "@me"], (data) => {
					if (!data) return undefined;

					const channel = data.find((x) => x.id === channelId);
					if (!channel) return data;

					return [{ ...channel, lastMessageId: messageId }, ...data.filter((x) => x.id !== channelId)];
				});
			},
		}),
	),
);
