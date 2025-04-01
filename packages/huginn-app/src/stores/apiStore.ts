import { queryClient } from "@/root";
import type { AppDirectChannel } from "@/types";
import { HuginnClient } from "@huginn/api";
import type { APIPublicUser, APIUser, PresenceUser, Snowflake } from "@huginn/shared";
import { type QueryClient, useQueryClient } from "@tanstack/react-query";
import { produce } from "immer";
import { type ReactNode, createContext, useContext, useMemo } from "react";
import { createStore, useStore } from "zustand";
import { combine } from "zustand/middleware";
import { settingsStore, useSettings } from "./settingsStore";

// biome-ignore lint/style/noNonNullAssertion: <explanation>
export let client: HuginnClient = undefined!;

const initialStore = () => ({
	users: [] as APIPublicUser[],
});

type StoreType = ReturnType<typeof initialStore>;

const store = createStore(
	combine(initialStore(), (set) => ({
		updateUser: (user: PresenceUser) =>
			set(
				produce((draft: StoreType) => {
					const index = draft.users.findIndex((x) => x.id === user.id);
					if (index !== -1) {
						draft.users[index] = { ...draft.users[index], ...user };
					}
				}),
			),
	})),
);

export function initializeClient() {
	const settings = settingsStore.getState();

	if (!window.location.pathname.includes("splashscreen") && client === undefined) {
		client = new HuginnClient({
			rest: { api: `${settings.serverAddress}/api` },
			cdn: { url: `${settings.cdnAddress}/cdn` },
			gateway: {
				url: `${settings.serverAddress}/gateway`,
				intents: 0,
				log: true,
				createSocket(url) {
					return new WebSocket(url);
				},
			},
			voice: {
				url: `http://192.168.178.51:3003/voice`,
				log: true,
				createSocket(url) {
					return new WebSocket(url);
				},
			},
		});

		client.gateway.connect();
	}

	const unlisten = client?.gateway.listen("ready", (d) => {
		const channelUsers = d.privateChannels.flatMap((x) => x.recipients);
		const relationUsers = d.relationships.map((x) => x.user);
		const presenceUsers = d.presences.map((x) => x.user);

		const userSources = [channelUsers, relationUsers].flat();
		const userMap = new Map<Snowflake, APIPublicUser>();

		for (const user of userSources) {
			userMap.set(user.id, { ...userMap.get(user.id), ...user });
		}

		userMap.set(d.user.id, d.user);

		store.setState({ users: Array.from(userMap.values()) });
	});

	const unlisten2 = client?.gateway.listen("presence_update", (d) => {
		store.getState().updateUser(d.user);
	});

	const unlisten3 = client?.gateway.listen("user_update", (d) => {
		store.getState().updateUser(d);
	});

	return () => {
		unlisten?.();
		unlisten2?.();
		unlisten3?.();
	};
}

export function useClient() {
	return client;
}

export const apiStore = store;
