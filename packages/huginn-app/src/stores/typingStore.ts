import type { GatewayTypingStartData, Snowflake } from "@huginn/shared";
import { listenEvent } from "@lib/eventHandler";
import { produce } from "immer";
import { useMemo } from "react";
import { createStore, useStore } from "zustand";
import { combine } from "zustand/middleware";
import { client } from "./apiStore";

const initialStore = () => ({
	typings: [] as Array<GatewayTypingStartData & { timeout: number }>,
});

type StoreType = ReturnType<typeof initialStore>;

const store = createStore(
	combine(initialStore(), (set) => ({
		updateTyping: (d: GatewayTypingStartData) =>
			set(
				produce((draft: StoreType) => {
					const existingIndex = draft.typings.findIndex((x) => x.userId === d.userId && x.channelId === d.channelId);
					if (existingIndex !== -1) {
						window.clearTimeout(draft.typings[existingIndex].timeout);
						draft.typings[existingIndex] = { ...draft.typings[existingIndex], ...d, timeout: startTimeout(d.userId, d.channelId) };
					} else {
						draft.typings.push({ ...d, timeout: startTimeout(d.userId, d.channelId) });
					}
				}),
			),

		removeTyping: (userId: Snowflake, channelId: Snowflake) =>
			set(
				produce((draft: StoreType) => {
					const index = draft.typings.findIndex((x) => x.userId === userId && x.channelId === channelId);
					if (index !== -1) {
						window.clearTimeout(draft.typings[index].timeout);
						draft.typings.splice(index, 1);
					}
				}),
			),
	})),
);

function startTimeout(userId: Snowflake, channelId: Snowflake) {
	const id = window.setTimeout(() => {
		store.getState().removeTyping(userId, channelId);
	}, 10000);

	return id;
}

export function initializeTyping() {
	const unlisten = client.gateway.listen("typying_start", (d) => {
		store.getState().updateTyping(d);
	});

	const unlisten2 = listenEvent("message_added", (d) => {
		store.getState().removeTyping(d.message.authorId, d.message.channelId);
	});

	return () => {
		unlisten();
		unlisten2();
	};
}

export function useTyping(userId: Snowflake) {
	const thisStore = useStore(store);
	const typings = useMemo(() => thisStore.typings.find((x) => x.userId === userId), [thisStore]);

	return { ...thisStore.removeTyping, typings };
}

export function useTypings() {
	return useStore(store);
}
