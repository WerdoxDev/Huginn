import type { UploadProgress } from "@/types";
import type { APIGetUserChannelsResult, Snowflake } from "@huginn/shared";
import type { QueryClient } from "@tanstack/react-query";
import { create } from "zustand";
import { combine } from "zustand/middleware";

export const useChannelStore = create(
	combine(
		{
			savedScrolls: new Map<Snowflake, number>(),
			currentVisibleMessages: [] as Array<{ messageId: Snowflake; messageTimestamp: number; channelId: Snowflake }>,
			messageUploadProgress: {} as Record<Snowflake, UploadProgress>,
		},
		(set) => ({
			saveScroll: (channelId: Snowflake, scroll: number) => set((state) => ({ savedScrolls: new Map(state.savedScrolls).set(channelId, scroll) })),
			resetScrolls: () => set({ savedScrolls: new Map() }),
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
			setMessageUploadProgress: (previewMessageId: Snowflake, progress: UploadProgress) =>
				set((state) => ({ messageUploadProgress: { ...state.messageUploadProgress, [previewMessageId]: progress } })),
			deleteMessageUploadProgress: (previewMessageId: Snowflake) =>
				set((state) => ({
					messageUploadProgress: Object.fromEntries(Object.entries(state.messageUploadProgress).filter(([id]) => id !== previewMessageId)),
				})),
		}),
	),
);
