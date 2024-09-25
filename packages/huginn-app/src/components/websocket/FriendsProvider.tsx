import { useClient } from "@contexts/apiContext";
import { type APIGetUserRelationshipsResult, type GatewayPublicUserUpdateData, omit } from "@huginn/shared";
import type { GatewayRelationshipCreateData } from "@huginn/shared";
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
		queryClient.setQueryData<APIGetUserRelationshipsResult>(["relationships"], (data) => data?.filter((x) => x.user.id !== userId));
	}

	function onPublicUserUpdated(newUser: GatewayPublicUserUpdateData) {
		queryClient.setQueryData<APIGetUserRelationshipsResult>(["relationships"], (old) =>
			old?.map((relationship) =>
				relationship.user.id === newUser.id
					? { ...relationship, user: omit(newUser, ["system"]) }
					: {
							...relationship,
						},
			),
		);
	}

	useEffect(() => {
		client.gateway.on("relationship_create", onRelationshipCreated);
		client.gateway.on("relationship_delete", onRelationshipDeleted);
		client.gateway.on("public_user_update", onPublicUserUpdated);

		return () => {
			client.gateway.off("relationship_create", onRelationshipCreated);
			client.gateway.off("relationship_delete", onRelationshipDeleted);
			client.gateway.off("public_user_update", onPublicUserUpdated);
		};
	}, []);

	return props.children;
}
