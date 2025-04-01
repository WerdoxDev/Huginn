import type { AppRelationship } from "@/types";
import { type APIGetUserRelationshipsResult, RelationshipType } from "@huginn/shared";
import type { APIRelationUser, GatewayPresenceUpdateData, GatewayReadyData, GatewayRelationshipCreateData } from "@huginn/shared";
import type { Snowflake } from "@huginn/shared";
import { convertToAppRelationship } from "@lib/utils";
import { useClient } from "@stores/apiStore";
import { useReadStates } from "@stores/readStatesStore";
import { useQueryClient } from "@tanstack/react-query";
import { type ReactNode, useEffect } from "react";

export default function FriendsProvider(props: { children?: ReactNode }) {
	const client = useClient();
	const queryClient = useQueryClient();
	const { setFriendsNotificationsCount } = useReadStates();

	function onRelationshipCreated(d: GatewayRelationshipCreateData) {
		const friends = queryClient.getQueryData<APIGetUserRelationshipsResult>(["relationships"]);
		if (!friends) return;

		if (friends.some((x) => x.id === d.id)) {
			const changedIndex = friends.findIndex((x) => x.id === d.id && x.type !== d.type);
			if (changedIndex !== -1) {
				const newRelationships = friends.toSpliced(changedIndex, 1, { ...friends[changedIndex], type: d.type });
				queryClient.setQueryData<APIGetUserRelationshipsResult>(["relationships"], newRelationships);
			}
			return;
		}

		const newFriends = queryClient.setQueryData<APIGetUserRelationshipsResult>(["relationships"], [...friends, d]);
		setFriendsNotificationsCount(newFriends?.filter((x) => x.type === RelationshipType.PENDING_INCOMING).length ?? 0);
	}

	function onRelationshipDeleted(userId: Snowflake) {
		const newFriends = queryClient.setQueryData<APIGetUserRelationshipsResult>(["relationships"], (old) =>
			old?.filter((x) => x.user.id !== userId),
		);
		setFriendsNotificationsCount(newFriends?.filter((x) => x.type === RelationshipType.PENDING_INCOMING).length ?? 0);
	}

	function onPresenceUpdated(presence: GatewayPresenceUpdateData) {
		const user = presence.user as APIRelationUser;
		if (presence.status === "offline") {
			return;
		}

		const newFriends = queryClient.setQueryData<APIGetUserRelationshipsResult>(["relationships"], (old) =>
			old?.map((relationship) => (relationship.user.id === user.id ? { ...relationship, user: { ...relationship.user, ...user } } : relationship)),
		);

		setFriendsNotificationsCount(newFriends?.filter((x) => x.type === RelationshipType.PENDING_INCOMING).length ?? 0);
	}

	useEffect(() => {
		client.gateway.on("relationship_add", onRelationshipCreated);
		client.gateway.on("relationship_remove", onRelationshipDeleted);
		// client.gateway.on("presence_update", onPresenceUpdated);

		queryClient.setQueryData<AppRelationship[]>(
			["relationships"],
			client.gateway.readyData?.relationships.map((x) => convertToAppRelationship(x)),
		);

		return () => {
			client.gateway.off("relationship_add", onRelationshipCreated);
			client.gateway.off("relationship_remove", onRelationshipDeleted);
			// client.gateway.off("presence_update", onPresenceUpdated);
		};
	}, []);

	return props.children;
}
