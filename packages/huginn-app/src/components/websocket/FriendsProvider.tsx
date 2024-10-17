import { useClient } from "@contexts/apiContext.tsx";
import type { APIGetUserRelationshipsResult } from "@huginn/shared";
import type { APIRelationUser, GatewayPresenceUpdateData, GatewayRelationshipCreateData } from "@huginn/shared";
import type { Snowflake } from "@huginn/shared";
import { useQueryClient } from "@tanstack/react-query";
import { type ReactNode, useEffect } from "react";

export default function FriendsProvider(props: { children?: ReactNode }) {
	const client = useClient();
	const queryClient = useQueryClient();

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

		queryClient.setQueryData(["relationships"], [...friends, d]);
	}

	function onRelationshipDeleted(userId: Snowflake) {
		queryClient.setQueryData<APIGetUserRelationshipsResult>(["relationships"], (old) => old?.filter((x) => x.user.id !== userId));
	}

	function onPresenceUpdated(presence: GatewayPresenceUpdateData) {
		const user = presence.user as APIRelationUser;
		if (presence.status === "offline") {
			return;
		}

		queryClient.setQueryData<APIGetUserRelationshipsResult>(["relationships"], (old) =>
			old?.map((relationship) =>
				relationship.user.id === user.id
					? { ...relationship, user: user }
					: {
							...relationship,
						},
			),
		);
	}

	useEffect(() => {
		client.gateway.on("relationship_add", onRelationshipCreated);
		client.gateway.on("relationship_remove", onRelationshipDeleted);
		client.gateway.on("presence_update", onPresenceUpdated);

		return () => {
			client.gateway.off("relationship_add", onRelationshipCreated);
			client.gateway.off("relationship_remove", onRelationshipDeleted);
			client.gateway.off("presence_update", onPresenceUpdated);
		};
	}, []);

	return props.children;
}
