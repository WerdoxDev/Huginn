import type { APIGetUserChannelsResult, APIPublicUser, Snowflake } from "@huginn/shared";
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
			connectedUsers: [] as Array<{ channelId: Snowflake; user: APIPublicUser; selfMute: boolean; selfDeaf: boolean }>,
			remoteSources: [] as Array<{ userId: Snowflake; consumerId: string; producerId: string; kind: "video" | "audio"; srcObject: MediaProvider }>,
		},
		(set) => ({
			setVoiceChannel: (channelId?: Snowflake, guildId?: Snowflake) => set({ channelId, guildId }),
			addConnectedUser: (channelId: Snowflake, user: APIPublicUser, selfMute: boolean, selfDeaf: boolean) =>
				set((state) => ({ connectedUsers: [...state.connectedUsers, { channelId, user, selfDeaf, selfMute }] })),
			removeConnectedUser: (userId: Snowflake) => set((state) => ({ connectedUsers: state.connectedUsers.filter((x) => x.user.id !== userId) })),
			addRemoteSource: (userId: Snowflake, consumerId: string, producerId: string, kind: "video" | "audio", srcObject: MediaProvider) =>
				set((state) => ({ remoteSources: [...state.remoteSources, { consumerId, kind, producerId, userId, srcObject }] })),
			removeRemoteSource: (producerId: string) =>
				set((state) => ({ remoteSources: state.remoteSources.filter((x) => x.producerId !== producerId) })),
		}),
	),
);

export function initializeVoice(queryClient: QueryClient) {
	const unlisten = client.gateway.listen("voice_state_update", (d) => {
		const channels = queryClient
			.getQueriesData<APIGetUserChannelsResult>({ queryKey: ["channels"] })
			.flatMap((x) => x[1])
			.filter((x) => x !== undefined);

		if (d.userId === userStore.getState().user?.id) {
			store.getState().setVoiceChannel(d.channelId ?? undefined, d.guildId ?? undefined);
		} else if (d.channelId) {
			const recipient = channels?.find((x) => x.id === d.channelId)?.recipients.find((x) => x.id === d.userId);
			if (!recipient) {
				console.error("User with id ", d.userId, "was not found");
				return;
			}

			store.getState().addConnectedUser(d.channelId, recipient, d.selfMute, d.selfDeaf);
		}
	});

	return () => {
		unlisten();
	};
}

export function useVoiceStore() {
	return useStore(store);
}
