import { RelationshipType, type Snowflake, snowflake } from "@huginn/shared";
import { listenEvent } from "@lib/eventHandler";
import { getCurrentPageMessages } from "@lib/utils";
import { windowStore } from "@stores/windowStore";
import type { QueryClient } from "@tanstack/react-query";
import { produce } from "immer";
import moment from "moment";
import { useMemo } from "react";
import { createStore, useStore } from "zustand";
import { combine } from "zustand/middleware";
import { sendNotification } from "../contexts/notificationContext";
import { apiStore, client } from "./apiStore";

export type ContextReadState = { channelId: Snowflake; lastReadMessageId?: Snowflake; unreadCount: number };

const initialStore = () => ({
	readStates: [] as Array<ContextReadState>,
	friendsNotificationsCount: 0,
});

type StoreType = ReturnType<typeof initialStore>;

const store = createStore(
	combine(initialStore(), (set, get) => ({
		setFriendsNotificationsCount: (count: number) => set({ friendsNotificationsCount: count }),
		setLatestReadMessage: (channelId: Snowflake, messageId: Snowflake, queryClient: QueryClient) => {
			const messages = getCurrentPageMessages(channelId, queryClient);
			if (!messages || !messages.some((x) => x.id === messageId)) return;

			const unreadCount = messages.filter((x) => moment(snowflake.getTimestamp(x.id)).isAfter(snowflake.getTimestamp(messageId))).length;

			set(
				produce((draft: StoreType) => {
					draft.readStates = draft.readStates.filter((x) => x.channelId !== channelId);
					draft.readStates.push({ channelId, lastReadMessageId: messageId, unreadCount: unreadCount });
				}),
			);
		},
		addChannelToReadStates: (channelId: Snowflake) =>
			set(
				produce((draft: StoreType) => {
					draft.readStates.push({ channelId, lastReadMessageId: undefined, unreadCount: 0 });
				}),
			),
		removeChannelFromReadStates: (channelId: Snowflake) =>
			set(
				produce((draft: StoreType) => {
					draft.readStates = draft.readStates.filter((x) => x.channelId !== channelId);
				}),
			),

		increaseUnreadCount: (channelId: Snowflake) =>
			set(
				produce((draft: StoreType) => {
					const readStateIndex = draft.readStates.findIndex((x) => x.channelId === channelId);
					if (readStateIndex !== -1) {
						draft.readStates[readStateIndex].unreadCount++;
					}
				}),
			),
	})),
);

export function initializeReadStates() {
	const unlisten = client.gateway.listen("ready", (d) => {
		store.setState({
			readStates: d.readStates.map((x) => ({
				channelId: x.channelId,
				lastReadMessageId: x.lastReadMessageId ?? undefined,
				unreadCount: x.unreadCount,
			})),
		});
		store.getState().setFriendsNotificationsCount(d.relationships.filter((x) => x.type === RelationshipType.PENDING_INCOMING).length);
	});

	const unlisten2 = listenEvent("message_added", async (data) => {
		if (!data.self && !data.visible) {
			const author = apiStore.getState().users.find((x) => x.id === data.message.authorId);
			// console.log(await join(await resourceDir(), "resources/huginn-text.png"));
			const audio = new Audio("/src/assets/notification.wav");
			audio.play();
			if (windowStore.getState().environment === "desktop") {
				sendNotification(
					data.message.channelId,
					author?.username ?? "Unknown User",
					data.message.content,
					"",
					//TODO: MIGRATION
					// await join(await resourceDir(), "resources/huginn-text.png"),
				);
			}
			store.getState().increaseUnreadCount(data.message.channelId);
		}
	});

	return () => {
		unlisten();
		unlisten2();
	};
}

export function useChannelReadState(channelId: Snowflake) {
	const thisStore = useStore(store);
	return useMemo(() => thisStore.readStates.find((x) => x.channelId === channelId), [thisStore.readStates, channelId]);
}

export function useReadStates() {
	return useStore(store);
}
