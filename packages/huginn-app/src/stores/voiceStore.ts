import type { GatewayCallState, GatewayVoiceState, Snowflake } from "@huginn/shared";
import { client } from "@stores/apiStore";
import { userStore } from "@stores/userStore";
import type { QueryClient } from "@tanstack/react-query";
import { produce } from "immer";
import { createStore, useStore } from "zustand";
import { combine } from "zustand/middleware";

const initialStore = () => ({
	channelId: undefined as Snowflake | undefined,
	guildId: undefined as Snowflake | undefined,
	voiceStates: [] as Array<GatewayVoiceState>,
	callStates: [] as Array<GatewayCallState>,
	remoteSources: [] as Array<{ userId: Snowflake; consumerId: string; producerId: string; kind: "video" | "audio"; srcObject: MediaProvider }>,
});

type StoreType = ReturnType<typeof initialStore>;

export const store = createStore(
	combine(initialStore(), (set) => ({
		setVoiceChannel: (channelId?: Snowflake, guildId?: Snowflake) => set({ channelId, guildId }),
		updateVoiceState: (
			channelId: Snowflake,
			guildId: Snowflake | null,
			userId: Snowflake,
			selfMute: boolean,
			selfDeaf: boolean,
			selfStream: boolean,
			selfVideo: boolean,
		) =>
			set(
				produce((draft: StoreType) => {
					const existingIndex = draft.voiceStates.findIndex((x) => x.userId === userId);
					if (existingIndex !== -1) {
						draft.voiceStates[existingIndex] = { channelId, userId, selfDeaf, selfMute, selfStream, selfVideo, guildId };
					} else {
						draft.voiceStates.push({ channelId, selfDeaf, selfMute, userId, selfStream, selfVideo, guildId });
					}
				}),
			),
		updateCallState: (channelId: Snowflake, messageId: Snowflake, ringing: Snowflake[]) =>
			set(
				produce((draft: StoreType) => {
					const existingIndex = draft.callStates.findIndex((x) => x.channelId === channelId);
					if (existingIndex !== -1) {
						draft.callStates[existingIndex] = { channelId, messageId, ringing };
					} else {
						draft.callStates.push({ channelId, messageId, ringing });
					}
				}),
			),
		removeVoiceState: (userId: Snowflake) => set((state) => ({ voiceStates: state.voiceStates.filter((x) => x.userId !== userId) })),
		removeCallState: (channelId: Snowflake) => set((state) => ({ callStates: state.callStates.filter((x) => x.channelId !== channelId) })),
		addRemoteSource: (userId: Snowflake, consumerId: string, producerId: string, kind: "video" | "audio", srcObject: MediaProvider) =>
			set((state) => ({ remoteSources: [...state.remoteSources, { consumerId, kind, producerId, userId, srcObject }] })),
		removeRemoteSource: (producerId: string) => set((state) => ({ remoteSources: state.remoteSources.filter((x) => x.producerId !== producerId) })),
		clearRemoteSources: () => set({ remoteSources: [] }),
	})),
);

export function initializeVoice(queryClient: QueryClient) {
	const unlisten = client.gateway.listen("ready", (d) => {
		store.setState({ voiceStates: d.voiceStates });
		store.setState({ callStates: d.callStates });
		console.log(d);
	});

	const unlisten2 = client.gateway.listen("call_create", (d) => {
		store.getState().updateCallState(d.channelId, d.messageId, d.ringing);
	});

	const unlisten3 = client.gateway.listen("call_update", (d) => {
		store.getState().updateCallState(d.channelId, d.messageId, d.ringing);
	});

	const unlisten4 = client.gateway.listen("call_delete", (d) => {
		store.getState().removeCallState(d.channelId);
	});

	const unlisten5 = client.gateway.listen("voice_state_update", (d) => {
		if (d.userId === userStore.getState().user?.id) {
			store.getState().setVoiceChannel(d.channelId ?? undefined, d.guildId ?? undefined);
		}
		if (d.channelId) {
			store.getState().updateVoiceState(d.channelId, d.guildId, d.userId, d.selfMute, d.selfDeaf, d.selfVideo, d.selfStream);
		} else {
			store.getState().removeVoiceState(d.userId);
		}
	});

	return () => {
		unlisten();
		unlisten2();
		unlisten3();
		unlisten4();
		unlisten5();
	};
}

export function useVoiceStore() {
	return useStore(store);
}
