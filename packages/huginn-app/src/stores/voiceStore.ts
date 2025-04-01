import type { APIGetUserChannelsResult, Snowflake } from "@huginn/shared";
import { client } from "@stores/apiStore";
import { userStore } from "@stores/userStore";
import type { QueryClient } from "@tanstack/react-query";
import { createStore, useStore } from "zustand";
import { combine } from "zustand/middleware";

export const store = createStore(
	combine(
		{
			channelId: undefined as Snowflake | undefined,
			guildId: undefined as Snowflake | undefined,
			connectedUsers: [] as Array<{ channelId: Snowflake; userId: Snowflake; selfMute: boolean; selfDeaf: boolean }>,
			remoteSources: [] as Array<{ userId: Snowflake; consumerId: string; producerId: string; kind: "video" | "audio"; srcObject: MediaProvider }>,
		},
		(set) => ({
			setVoiceChannel: (channelId?: Snowflake, guildId?: Snowflake) => set({ channelId, guildId }),
			addConnectedUser: (channelId: Snowflake, userId: Snowflake, selfMute: boolean, selfDeaf: boolean) =>
				set((state) => ({ connectedUsers: [...state.connectedUsers, { channelId, userId, selfDeaf, selfMute }] })),
			removeConnectedUser: (userId: Snowflake) => set((state) => ({ connectedUsers: state.connectedUsers.filter((x) => x.userId !== userId) })),
			addRemoteSource: (userId: Snowflake, consumerId: string, producerId: string, kind: "video" | "audio", srcObject: MediaProvider) =>
				set((state) => ({ remoteSources: [...state.remoteSources, { consumerId, kind, producerId, userId, srcObject }] })),
			removeRemoteSource: (producerId: string) =>
				set((state) => ({ remoteSources: state.remoteSources.filter((x) => x.producerId !== producerId) })),
			clearRemoteSources: () => set({ remoteSources: [] }),
		}),
	),
);

export function initializeVoice(queryClient: QueryClient) {
	const unlisten = client.gateway.listen("voice_state_update", (d) => {
		if (d.userId === userStore.getState().user?.id) {
			store.getState().setVoiceChannel(d.channelId ?? undefined, d.guildId ?? undefined);
		}
		if (d.channelId) {
			store.getState().addConnectedUser(d.channelId, d.userId, d.selfMute, d.selfDeaf);
		} else {
			store.getState().removeConnectedUser(d.userId);
		}
	});

	return () => {
		unlisten();
	};
}

export function useVoiceStore() {
	return useStore(store);
}
