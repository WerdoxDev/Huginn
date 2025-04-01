import type { AppRelationship } from "@/types";
import { RelationshipType } from "@huginn/shared";
import type { GatewayRelationshipCreateData } from "@huginn/shared";
import type { Snowflake } from "@huginn/shared";
import { convertToAppRelationship } from "@lib/utils";
import { useClient } from "@stores/apiStore";
import { useReadStates } from "@stores/readStatesStore";
import { useQueryClient } from "@tanstack/react-query";
import { produce } from "immer";
import { type ReactNode, useEffect } from "react";

export default function FriendsProvider(props: { children?: ReactNode }) {
	const client = useClient();
	const queryClient = useQueryClient();
	const { setFriendsNotificationsCount } = useReadStates();

	function onRelationshipCreated(d: GatewayRelationshipCreateData) {
		const friends = queryClient.getQueryData<AppRelationship[]>(["relationships"]);
		if (!friends) return;

		const newFriends = produce(friends, (draft) => {
			const changedIndex = draft.findIndex((x) => x.id === d.id && x.type !== d.type);
			if (changedIndex !== -1) {
				draft[changedIndex].type = d.type;
			} else {
				draft.push(convertToAppRelationship(d));
			}
		});

		queryClient.setQueryData<AppRelationship[]>(["relationships"], newFriends);
		setFriendsNotificationsCount(newFriends?.filter((x) => x.type === RelationshipType.PENDING_INCOMING).length ?? 0);
	}

	function onRelationshipDeleted(userId: Snowflake) {
		const newFriends = queryClient.setQueryData<AppRelationship[]>(["relationships"], (old) => old?.filter((x) => x.userId !== userId));
		setFriendsNotificationsCount(newFriends?.filter((x) => x.type === RelationshipType.PENDING_INCOMING).length ?? 0);
	}

	useEffect(() => {
		client.gateway.on("relationship_add", onRelationshipCreated);
		client.gateway.on("relationship_remove", onRelationshipDeleted);

		queryClient.setQueryData<AppRelationship[]>(
			["relationships"],
			client.gateway.readyData?.relationships.map((x) => convertToAppRelationship(x)),
		);

		return () => {
			client.gateway.off("relationship_add", onRelationshipCreated);
			client.gateway.off("relationship_remove", onRelationshipDeleted);
		};
	}, []);

	return props.children;
}
